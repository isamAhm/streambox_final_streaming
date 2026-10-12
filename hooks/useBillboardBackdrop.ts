import { create } from 'zustand';

interface BillboardBackdropStore {
    backdropUrl: string;
    setBackdropUrl: (url: string) => void;
}

const useBillboardBackdrop = create<BillboardBackdropStore>((set) => ({
    backdropUrl: '',
    setBackdropUrl: (url: string) => set({ backdropUrl: url }),
}));

export default useBillboardBackdrop;
