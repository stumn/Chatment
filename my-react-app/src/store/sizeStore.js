// store/useSizeStore.js
import { create } from 'zustand';

const useSizeStore = create((set) => ({
    width: Math.min(1000, window.innerWidth * 0.9),
    height: Math.min(800, window.innerHeight * 0.9),

    updateSize: () => {
        set({
            width: Math.min(1000, window.innerWidth * 0.9),
            height: Math.min(800, window.innerHeight * 0.9),
        });
    },
}));

export default useSizeStore;
