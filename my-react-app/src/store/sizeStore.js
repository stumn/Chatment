// store/useSizeStore.js
import { create } from 'zustand';

const useSizeStore = create((set) => ({
    width: Math.min(800, window.innerWidth * 0.9),
    height: Math.min(800, window.innerHeight * 0.95),

    updateSize: () => {
        set({
            width: Math.min(800, window.innerWidth * 0.9),
            height: Math.min(800, window.innerHeight * 0.95),
        });
    },
}));

export default useSizeStore;
