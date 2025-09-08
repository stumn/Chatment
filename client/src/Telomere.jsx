export default function Telomere({ heightArray, CONTAINER_HEIGHT }) {

    return (
        <div id="telomere-div" style={{ width: '10px', height: CONTAINER_HEIGHT }}>
            {heightArray.map((height, index) => (
                <div
                    key={index}
                    className="telomere"
                    style={{
                        position: 'absolute',
                        top: `${height + 24}px`,
                        width: '10px',
                        height: '20px',
                        backgroundColor: 'rgba(4, 149, 35, 0.51)',
                        mixBlendMode: 'multiply',
                    }}
                />
            ))}
        </div>
    );
}
