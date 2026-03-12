export type BannerMode = "quick" | "scheduled";
export type BannerRedirectType = "category" | "product" | "combo";

export interface Banner {
    id: string;
    title: string;
    image: string;
    mode: BannerMode;
    categoryId?: string;
    redirectType: BannerRedirectType;
    redirectId: string;
    priority: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBannerInput {
    title: string;
    image: string;
    mode: BannerMode;
    categoryId?: string;
    redirectType: BannerRedirectType;
    redirectId: string;
    priority: number;
    active: boolean;
}

export interface UpdateBannerInput extends Partial<CreateBannerInput> {
    id: string;
}
