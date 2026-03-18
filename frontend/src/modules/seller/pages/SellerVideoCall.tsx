import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type UID,
} from "agora-rtc-sdk-ng";
import { useAuth } from "../../../context/AuthContext";
import { getAgoraToken, getVendorsForCall, type VendorForCall } from "../../../services/api/sellerCallService";

type RemoteUser = {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
};

export default function SellerVideoCall() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const appId = import.meta.env.VITE_AGORA_APP_ID as string | undefined;

  const initialChannel = searchParams.get("channel") || "";
  const initialToken = searchParams.get("token") || "";
  const initialUid = searchParams.get("uid") || "";

  const [channel, setChannel] = useState(initialChannel);
  const [token, setToken] = useState(initialToken);
  const [uid, setUid] = useState(initialUid);

  const [vendors, setVendors] = useState<VendorForCall[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [startingCall, setStartingCall] = useState(false);

  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camRef = useRef<ICameraVideoTrack | null>(null);

  const localVideoElRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const hasIncomingCallParams = useMemo(() => {
    const ch = searchParams.get("channel") || "";
    const tk = searchParams.get("token") || "";
    return Boolean(ch && tk);
  }, [searchParams]);

  const canJoin = useMemo(() => {
    return Boolean(appId && appId.trim()) && Boolean(channel.trim());
  }, [appId, channel]);

  const isConnected = joined && remoteUsers.length > 0;
  const isConnecting = (startingCall || status.toLowerCase().includes("joining") || status.toLowerCase().includes("preparing")) && !isConnected;

  const setRemoteVideoEl = useCallback((key: string, el: HTMLDivElement | null) => {
    const map = remoteVideoElsRef.current;
    if (!el) {
      map.delete(key);
      return;
    }
    map.set(key, el);
  }, []);

  const stopAndCloseLocalTracks = useCallback(async () => {
    const mic = micRef.current;
    const cam = camRef.current;
    micRef.current = null;
    camRef.current = null;

    try {
      mic?.stop();
      mic?.close();
    } catch {
      // ignore
    }
    try {
      cam?.stop();
      cam?.close();
    } catch {
      // ignore
    }
  }, []);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    setError("");
    setStatus("Leaving…");

    await stopAndCloseLocalTracks();
    setRemoteUsers([]);

    if (client) {
      try {
        client.removeAllListeners();
        await client.leave();
      } catch {
        // ignore
      }
    }

    clientRef.current = null;
    setJoined(false);
    setMuted(false);
    setCameraOff(false);
    setStatus("");
  }, [stopAndCloseLocalTracks]);

  const join = useCallback(async (opts?: { channel?: string; token?: string; uid?: string }) => {
    setError("");

    const joinChannel = (opts?.channel ?? channel).trim();
    const joinToken = (opts?.token ?? token).trim();
    const joinUidRaw = (opts?.uid ?? uid).trim();

    if (!appId || !appId.trim()) {
      setError("Missing Agora App ID. Set VITE_AGORA_APP_ID in your .env file.");
      return;
    }
    if (!joinChannel) {
      setError("Channel name is required.");
      return;
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
      } catch {
        return;
      }

      if (mediaType === "video") {
        setRemoteUsers((prev) => {
          const existing = prev.find((u) => String(u.uid) === String(user.uid));
          const nextUser: RemoteUser = { uid: user.uid, videoTrack: user.videoTrack || undefined };
          return existing
            ? prev.map((u) => (String(u.uid) === String(user.uid) ? nextUser : u))
            : [...prev, nextUser];
        });
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        setRemoteUsers((prev) => prev.filter((u) => String(u.uid) !== String(user.uid)));
      }
    });

    client.on("user-left", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => String(u.uid) !== String(user.uid)));
    });

    setStatus("Joining…");
    try {
      const parsedUid: UID | null = joinUidRaw
        ? Number.isNaN(Number(joinUidRaw))
          ? joinUidRaw
          : Number(joinUidRaw)
        : null;

      await client.join(appId, joinChannel, joinToken || null, parsedUid);

      const [mic, cam] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);
      micRef.current = mic;
      camRef.current = cam;

      if (localVideoElRef.current) {
        cam.play(localVideoElRef.current);
      }

      await client.publish([mic, cam]);

      setJoined(true);
      setStatus("");

      setSearchParams((prevParams) => {
        const p = new URLSearchParams(prevParams);
        p.set("channel", joinChannel);
        if (joinToken) p.set("token", joinToken);
        else p.delete("token");
        if (joinUidRaw) p.set("uid", joinUidRaw);
        else p.delete("uid");
        return p;
      });
    } catch (e: any) {
      await leave();
      setError(e?.message || "Failed to join video call.");
      setStatus("");
    }
  }, [appId, channel, token, uid, leave, setSearchParams]);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      setError("");
      try {
        const res = await getVendorsForCall();
        if (res?.success && Array.isArray(res.data)) {
          setVendors(res.data);
        } else {
          setVendors([]);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load vendors.");
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  const startDirectCall = useCallback(async () => {
    const meId = user?.id || user?._id || "";
    if (!meId) {
      setError("Missing seller id in session. Please logout/login again.");
      return;
    }
    if (!selectedVendorId) {
      setError("Please select a vendor to call.");
      return;
    }

    const channelName = `vendor-${[String(meId), String(selectedVendorId)].sort().join("-")}`.slice(0, 64);

    setStartingCall(true);
    setError("");
    setStatus("Preparing call…");
    try {
      const tokenRes = await getAgoraToken(channelName);
      if (!tokenRes?.success || !tokenRes.data?.token) {
        throw new Error(tokenRes?.message || "Token server is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE on backend.");
      }

      setChannel(tokenRes.data.channel);
      setToken(tokenRes.data.token);
      setUid(tokenRes.data.uid);

      setSearchParams((prevParams) => {
        const p = new URLSearchParams(prevParams);
        p.set("channel", tokenRes.data!.channel);
        return p;
      });

      await join({
        channel: tokenRes.data.channel,
        token: tokenRes.data.token,
        uid: tokenRes.data.uid,
      });
    } catch (e: any) {
      setError(e?.message || "Failed to start call.");
      setStatus("");
    } finally {
      setStartingCall(false);
    }
  }, [join, selectedVendorId, setSearchParams, user]);

  useEffect(() => {
    // When remoteUsers update, play their video tracks into the assigned containers.
    for (const ru of remoteUsers) {
      if (!ru.videoTrack) continue;
      const el = remoteVideoElsRef.current.get(String(ru.uid));
      if (!el) continue;
      try {
        ru.videoTrack.play(el);
      } catch {
        // ignore
      }
    }
  }, [remoteUsers]);

  useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  const toggleMute = useCallback(async () => {
    const mic = micRef.current;
    if (!mic) return;
    const next = !muted;
    try {
      await mic.setEnabled(!next);
      setMuted(next);
    } catch {
      // ignore
    }
  }, [muted]);

  const toggleCamera = useCallback(async () => {
    const cam = camRef.current;
    if (!cam) return;
    const next = !cameraOff;
    try {
      await cam.setEnabled(!next);
      setCameraOff(next);
    } catch {
      // ignore
    }
  }, [cameraOff]);

  const acceptIncomingCall = useCallback(async () => {
    const ch = searchParams.get("channel") || "";
    const tk = searchParams.get("token") || "";
    const incomingUid = searchParams.get("uid") || "";

    if (!ch || !tk) {
      setError("Incoming call link is invalid or expired.");
      return;
    }

    setChannel(ch);
    setToken(tk);
    setUid(incomingUid);

    await join({
      channel: ch,
      token: tk,
      uid: incomingUid,
    });
  }, [join, searchParams]);

  const rejectIncomingCall = useCallback(() => {
    setStatus("Call rejected.");
    setSearchParams((prevParams) => {
      const p = new URLSearchParams(prevParams);
      p.delete("channel");
      p.delete("token");
      p.delete("uid");
      return p;
    });
  }, [setSearchParams]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Vendor Video Call</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Two vendors join the <span className="font-medium">same channel</span> to connect.
            </p>
          </div>
          <div className="text-sm">
            {isConnected ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : joined ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Connecting…
              </span>
            ) : isConnecting ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Connecting…
              </span>
            ) : status ? (
              <span className="text-neutral-600">{status}</span>
            ) : null}
          </div>
        </div>

        {hasIncomingCallParams && !joined ? (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-teal-900">Incoming video call</div>
              <div className="text-xs text-teal-800 mt-1">
                You have an incoming vendor call. Accept to join the call or reject to dismiss.
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={rejectIncomingCall}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-800"
              >
                Reject
              </button>
              <button
                onClick={acceptIncomingCall}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium"
              >
                Accept
              </button>
            </div>
          </div>
        ) : null}

        {!appId ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
            Set <span className="font-mono">VITE_AGORA_APP_ID</span> in <span className="font-mono">frontend/.env</span> to enable calling.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-neutral-700">Select vendor</label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                disabled={joined || loadingVendors}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-neutral-100"
              >
                <option value="">{loadingVendors ? "Loading vendors…" : "Choose vendor"}</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {(v.storeName || v.sellerName || "Vendor") + (v.mobile ? ` (${v.mobile})` : "")}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1 flex gap-2">
              {!joined ? (
                <button
                  onClick={startDirectCall}
                  disabled={!appId || !appId.trim() || startingCall || !selectedVendorId}
                  className="w-full px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {startingCall ? "Starting…" : "Call"}
                </button>
              ) : (
                <button
                  onClick={leave}
                  className="w-full px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
                >
                  End call
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleMute}
              disabled={!joined}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium disabled:opacity-50"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={toggleCamera}
              disabled={!joined}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium disabled:opacity-50"
            >
              {cameraOff ? "Camera on" : "Camera off"}
            </button>
            {joined ? (
              <span className="text-xs text-neutral-500">
                Channel: <span className="font-mono">{channel}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-neutral-800">Remote</div>
              {joined && !isConnected ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                  Waiting for vendor to join…
                </div>
              ) : null}
            </div>
            {remoteUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600 min-h-[360px] flex items-center justify-center">
                {joined ? "Connecting… Please wait." : "Select a vendor and click Call."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {remoteUsers.map((ru) => (
                  <div
                    key={String(ru.uid)}
                    className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950 aspect-video relative"
                  >
                    <div ref={(el) => setRemoteVideoEl(String(ru.uid), el)} className="w-full h-full" />
                    <div className="absolute left-2 bottom-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                      Vendor connected
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-medium text-neutral-800 mb-2">You</div>
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950 aspect-video min-h-[240px]">
              <div ref={localVideoElRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

