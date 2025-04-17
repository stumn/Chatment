
export default function Telomere({ heightArray }) {

    console.log('Telomere', heightArray); // デバッグ用

    return (
        <div>
            {heightArray.map((height, index) => {
                console.log(`Height ${index}:`, height); // デバッグ用

                return (
                    <div key={index}
                        style={{
                            position: 'absolute',
                            top: `${height}px`,
                            width: '10px',
                            height: `20px`,
                            backgroundColor: 'green'
                        }}>
                    </div>
                );
            })}
        </div>
    );

}