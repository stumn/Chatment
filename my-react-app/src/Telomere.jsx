
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
                            // left: `${index * 5}px`, // 横に並べるための位置調整
                            width: '10px',
                            height: `20px`,
                            backgroundColor: 'hsla(133,95%,30%,0.51)', /* 緑・透明 */
                            mixBlendMode: 'multiply', /* "screen", "overlay" なども試すと面白い */
                        }}>
                    </div>
                );
            })}
        </div >
    );

}