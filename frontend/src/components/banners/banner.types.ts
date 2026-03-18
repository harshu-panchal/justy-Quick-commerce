export type BannerMode = "quick" | "scheduled";

export interface Banner {
    _id: string;
    title: string;
    imageUrl: string;
    type: BannerMode;
    isActive: boolean;
    linkType?: 'category' | 'product' | 'external' | 'none';
    linkValue?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateBannerInput {
    title: string;
    imageUrl: string;
    type: BannerMode;
    isActive: boolean;
    linkType?: 'category' | 'product' | 'external' | 'none';
    linkValue?: string;
}

export interface UpdateBannerInput extends Partial<CreateBannerInput> {
    _id: string;
}
