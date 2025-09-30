export default function Telomere({ heightArray, CONTAINER_HEIGHT }) {
    return (
        <div 
            id="telomere-div" 
            className="w-2.5" 
            style={{ height: CONTAINER_HEIGHT }}
        >
            {heightArray.map((height, index) => (
                <div
                    key={index}
                    className="absolute w-2.5 h-5 bg-green-600/50 mix-blend-multiply"
                    style={{
                        top: `${height + 24}px`,
                    }}
                />
            ))}
        </div>
    );
}
