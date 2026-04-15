import { useState, useEffect } from "react";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  Role,
} from "../../../services/api/admin/roleService";

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: [] as string[],
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, [pagination.currentPage]);

  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await getRoles({
        page: pagination.currentPage,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setRoles(response.data);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalPages: response.pagination!.pages,
            totalRecords: response.pagination!.total,
          }));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching roles");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (perm: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedPermissions.includes(perm);
      if (isSelected) {
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter((p) => p !== perm),
        };
      } else {
        return {
          ...prev,
          selectedPermissions: [...prev.selectedPermissions, perm],
        };
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      selectedPermissions: [],
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setError("Please enter role name");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const response = await updateRole(editingId, {
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        if (response.success) {
          setSuccessMessage("Role updated successfully!");
          resetForm();
          fetchRoles();
        }
      } else {
        const response = await createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        if (response.success) {
          setSuccessMessage("Role created successfully!");
          resetForm();
          fetchRoles();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error saving role");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description || "",
      selectedPermissions: role.permissions,
    });
    setEditingId(role._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    setLoading(true);
    try {
      const response = await deleteRole(id);
      if (response.success) {
        setSuccessMessage("Role deleted successfully!");
        fetchRoles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error deleting role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Role Management
          </h1>
          <div className="text-sm text-blue-500">
            <span className="text-blue-500 hover:underline cursor-pointer">
              Home
            </span>{" "}
            <span className="text-neutral-400">/</span> System Settings
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Create/Edit Role Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Role" : "Create New Role"}
              </h2>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center justify-between">
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="text-red-700 hover:text-red-900 ml-4 text-lg font-bold">
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center justify-between">
                <p className="text-sm">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="text-green-700 hover:text-green-900 ml-4 text-lg font-bold">
                  ×
                </button>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Content Manager"
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A brief description of this role"
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Permissions <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border border-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          id={perm}
                          checked={formData.selectedPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <label
                          htmlFor={perm}
                          className="text-xs text-neutral-700 capitalize cursor-pointer select-none">
                          {perm.replace(/_/g, " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded text-sm font-medium transition-colors">
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Role"
                    : "Create Role"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-neutral-700 py-2.5 rounded text-sm font-medium transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Roles List Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-semibold">Existing Roles</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              {loading && roles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Role Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {roles.map((role) => (
                        <tr key={role._id} className="hover:bg-neutral-50 border-b border-neutral-100">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {role.name}
                            </div>
                            {role.description && (
                              <div className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                                {role.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                role.type === "System"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                              {role.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-neutral-700 font-medium">
                              {role.permissions?.length || 0} Permissions
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {role.type !== "System" ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(role)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(role._id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-neutral-400 font-medium uppercase px-2 py-1 bg-neutral-50 border border-neutral-200 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
