import './App.css'
import { useState, useEffect } from 'react'
import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'

function App() {
  const [isName, setIsName] = useState(); // socketの接続状態を管理するステート

  const [messages, setMessages] = useState([
    { name: 'Alice', message: '昨日から始めたゲーム、気づいたら朝だった…。', time: "10:00", fav: 0 },
    { name: 'Bob', message: 'あるある。で、朝になってめちゃくちゃ後悔するやつ。', time: "10:01", fav: 0 },
    { name: 'Catherine', message: 'そのまま寝ないで学校行ったことある。人間のやることじゃない。', time: "10:02", fav: 0 },
    { name: 'David', message: 'ゲームってほどじゃないけど、夜中に気になったWikipedia記事読み始めると終わらん。', time: "10:03", fav: 0 },
    { name: 'Eva', message: 'それな。「10分だけ」って思ったら2時間経ってる。', time: "10:04", fav: 0 },
    { name: 'Frank', message: 'しかもそこから関連リンク飛び続ける無限ループね。', time: "10:05", fav: 0 },
    { name: 'Grace', message: '昨日も気づいたら「深海魚の進化」についてめっちゃ詳しくなってた。', time: "10:06", fav: 0 },
    { name: 'Henry', message: 'ネットサーフィンの旅、いつも思いもよらないところに着地するよね。', time: "10:07", fav: 0 },
    { name: 'Ivy', message: 'そういう意味ではYouTubeのおすすめ動画もなかなか深淵。', time: "10:08", fav: 0 },
    { name: 'Jack', message: 'YouTube、気づいたら「なぜカラスは賢いのか」みたいな動画になってる。', time: "10:09", fav: 0 },
    { name: 'Kate', message: 'いや、それ昨日私も観たんだが？w', time: "10:10", fav: 0 },
    { name: 'Leo', message: 'みんな同じアルゴリズムに支配されてるな…。', time: "10:11", fav: 0 },
    { name: 'Mia', message: 'そういえば、今期のアニメ何か観てる？', time: "10:12", fav: 0 },
    { name: 'Nick', message: 'まだ観れてない…観ようと思ってる作品はめっちゃあるのに。', time: "10:13", fav: 0 },
    { name: 'Olivia', message: '積みアニメの山が高すぎる…。何から手をつければいいかわからん。', time: "10:14", fav: 0 },
    { name: 'Peter', message: 'わかる。しかも「一気見したいから完結してから観よう」とか思ってたら、結局観ないやつ。', time: "10:15", fav: 0 },
    { name: 'Queen', message: 'んで、気づいたら3年経ってて、「え、これ今さら観るの？」ってなる。', time: "10:16", fav: 0 },
    { name: 'Rose', message: 'そして新しいアニメが始まって、また積みアニメが増える無限ループ。', time: "10:17", fav: 0 },
    { name: 'Sam', message: 'いや、観るべきアニメ多すぎるんよ。時間足りん。', time: "10:18", fav: 0 },
    { name: 'Tom', message: 'その点、短編アニメって神じゃね？', time: "10:19", fav: 0 },
    { name: 'Uma', message: '5分アニメとかだと気軽に観られるよね。でも気軽すぎて逆に続けて観ちゃう。', time: "10:20", fav: 0 },
    { name: 'Vince', message: '結局長時間視聴してるという罠。', time: "10:21", fav: 0 },
    { name: 'Will', message: 'どうせなら名作観ようと思って、「昔の名作アニメランキング」とか調べちゃう。', time: "10:22", fav: 0 },
    { name: 'Xavier', message: 'わかる。でも結局「長いな…」って思って観ないパターン。', time: "10:23", fav: 0 },
    { name: 'Yvonne', message: 'それでまた最新アニメをチェックし始めて、最初に戻る、と。', time: "10:24", fav: 0 },
    { name: 'Zack', message: 'オタクの業は深い…。', time: "10:25", fav: 0 }
  ]);
  const [lines, setLines] = useState(3);
  // const chatMessages = lines === 0 ? [] : messages.slice(-lines);
  const chatMessages = messages;

  const [docMessages, setDocMessages] = useState([]);
  useEffect(() => {
    setDocMessages(messages.slice(0, Math.max(0, messages.length - lines)));
  }, [messages, lines]);

  const handleSendMessage = (message) => {
    setMessages([...messages, message]);
  };

  const handleUpdateFav = (index) => {
    const updatedMessages = [...messages];
    console.log(updatedMessages);
    console.log(updatedMessages[index]);
    if (!updatedMessages[index]) return;
    updatedMessages[index].fav += 1;
    setMessages(updatedMessages);
  };

  return (
    <div>
      <h6 style={{ fontSize: '20px', margin: '8px 0', textAlign: 'left'}}>
        {isName ? 'Logged in as ' + isName : 'Please enter your name'}
      </h6>
      <ResizablePanels
        chatMessages={chatMessages}
        docMessages={docMessages}
        onChangeDoc={setDocMessages}
        onChangeLines={setLines}
        onUpdateFav={handleUpdateFav}
      />
      <InputForm isLoggedin={isName} onLogin={setIsName
      } onSendMessage={handleSendMessage} />
    </div>
  )
}

export default App
