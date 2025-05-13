import { create } from 'zustand';

const useSizeStore = create((set) => ({
    width: Math.min(1000, window.innerWidth * 0.9),
    height: Math.min(800, window.innerHeight * 0.9),
    
    updateSize: () => set({
        width: Math.min(1000, window.innerWidth * 0.9),
        height: Math.min(800, window.innerHeight * 0.9),
    }),
}));

// Add event listener to update the store on window resize
window.addEventListener('resize', () => {
    useSizeStore.getState().updateSize();
});

export default useSizeStore;