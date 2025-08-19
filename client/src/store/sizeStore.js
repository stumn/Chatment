// store/useSizeStore.js
import { create } from 'zustand';

const useSizeStore = create((set) => ({
    width: Math.min(800, window.innerWidth * 0.9),
    height: window.innerHeight,

    updateSize: () => {
        set({
            width: Math.min(800, window.innerWidth * 0.9),
            height: window.innerHeight,
        });
    },
}));

export default useSizeStore;
