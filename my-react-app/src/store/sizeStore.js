// store/useSizeStore.js
import { create } from 'zustand';

const useSizeStore = create((set) => ({
    width: Math.min(800, window.innerWidth * 0.9),
    height: '95vh',

    updateSize: () => {
        set({
            width: Math.min(800, window.innerWidth * 0.9),
            height: '95vh',
        });
    },
}));

export default useSizeStore;
