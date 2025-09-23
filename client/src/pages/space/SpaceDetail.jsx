// SpaceDetail.jsx - パスパラメータを使用したスペース詳細画面
import { useParams } from 'react-router-dom';

function SpaceDetail() {
  // URLパスパラメータを取得
  const { id } = useParams(); // /space/1 の "1" を取得

  return (
    <div>
      <h1>スペース詳細</h1>
      <p>スペースID: {id}</p>
      {/* APIを使ってデータを取得する例 */}
      <SpaceContent spaceId={id} />
    </div>
  );
}

function SpaceContent({ spaceId }) {
  // ここでAPIからデータを取得
  // fetch(`/api/spaces/${spaceId}`) など
  return <div>スペース{spaceId}のコンテンツ</div>;
}

export default SpaceDetail;