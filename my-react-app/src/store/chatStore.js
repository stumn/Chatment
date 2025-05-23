import { create } from 'zustand';

const useChatStore = create((set) => ({
  // チャットメッセージの一覧
  messages: [
    { id: 1, order: 1, name: '渡辺涼', msg: '感情認識とタスク協調の組み合わせ、最近増えてきた気がしますね。今回のはどう位置付けられるんだろう？', time: '10:00:04', fav: 0 },
    { id: 2, order: 2, name: '小島葉月', msg: '対話相手の感情状態を逐次モニタして応答変えるって、まさに今求められてるやつ', time: '10:00:17', fav: 0 },
    { id: 3, order: 3, name: '藤原悠斗', msg: '協同的ってワード気になってたけど、発表聞いてたら「共同編集」支援にも通じる設計なんですね', time: '10:00:31', fav: 0 },
    { id: 4, order: 4, name: '佐山真理子', msg: 'スライド4のアーキテクチャ図わかりやすかったです。感情→対話戦略の流れが明快', time: '10:00:45', fav: 0 },
    { id: 5, order: 5, name: '発表者（田村悠介）', msg: '@佐山 さん、ありがとうございます！意図通じて嬉しいです', time: '10:00:58', fav: 0 },
    { id: 6, order: 6, name: '田中颯太', msg: '感情推定部分って教師ありですか？ラベルどうやって取ったんでしょう？', time: '10:01:13', fav: 0 },
    { id: 7, order: 7, name: '田村悠介', msg: '@田中 さん、はい、対話コーパスにアノテーションされた6感情分類タスクで学習しています', time: '10:01:29', fav: 0 },
    { id: 8, order: 8, name: '中村瑞穂', msg: 'インタラクションのデザイン指針、スライド7に出てた行動選択ルールが直感的でよかった', time: '10:01:43', fav: 0 },
    { id: 9, order: 9, name: '吉村拓郎（企業）', msg: '応答選択の重み付けが感情に応じてスムーズに変化してるの、すごく実用的ですね', time: '10:01:57', fav: 0 },
    { id: 10, order: 10, name: '長谷川楓', msg: '話し方もテンポ良くて聞き取りやすい。こういうプレゼン憧れる…', time: '10:02:10', fav: 0 },
    { id: 11, order: 11, name: '上原実咲', msg: '感情→意図→対話戦略の3段階構成、どこで分岐させるかって難しいですよね。判断基準知りたい', time: '10:02:23', fav: 0 },
    { id: 12, order: 12, name: '田村悠介', msg: '@上原 さん、ご指摘の通りです。意図検出器は注意分布を使って中間層で補助的に判別してます', time: '10:02:38', fav: 0 },
    { id: 13, order: 13, name: '林寛太', msg: '応用例が「ペア作文支援」だったの面白かった。教育領域とも接点ありそう', time: '10:02:51', fav: 0 },
    { id: 14, order: 14, name: '岡田誠一', msg: '「共感的介入」でタスク成功率上がるって、もう少し具体的な数値見たいですね', time: '10:03:03', fav: 0 },
    { id: 15, order: 15, name: '田村悠介', msg: '@岡田 さん、スライド10の右端、F1で約+6%、タイムアウト率も15%低下しています', time: '10:03:19', fav: 0 },
    { id: 16, order: 16, name: '井上千夏', msg: 'こういう文脈での感情って、ユーザ側だけでなくシステム側の状態も考慮すべきですよね？', time: '10:03:33', fav: 0 },
    { id: 17, order: 17, name: '田村悠介', msg: '@井上 さん、その通りです。発話履歴＋直近の応答傾向も含めて感情状態を予測しています', time: '10:03:47', fav: 0 },
    { id: 18, order: 18, name: '森田一郎（教授）', msg: '初期応答と中盤以降で対話戦略が変化していたように見えたが、段階的制御を意識しているか？', time: '10:04:00', fav: 0 },
    { id: 19, order: 19, name: '田村悠介', msg: '@森田先生 ご指摘ありがとうございます。はい、状態遷移グラフで段階別に制御しています', time: '10:04:15', fav: 0 },
    { id: 20, order: 20, name: '藤井卓也', msg: 'ユーザが混乱してるときだけでなく、落ち着いたときにも介入があるの、好印象でした', time: '10:04:28', fav: 0 },
    { id: 21, order: 21, name: '小島葉月', msg: '途中のケーススタディ、リアリティあってすごく良かった。やっぱデモ映像あると伝わりますね', time: '10:04:43', fav: 0 },
    { id: 22, order: 22, name: '石橋浩司（企業）', msg: '商談サポートにも応用できそうな構成。うちの部署で試せないかな…', time: '10:04:57', fav: 0 },
    { id: 23, order: 23, name: '清水愛', msg: '発話中の非言語的要素（絵文字、句読点）の扱いも評価されてました？', time: '10:05:10', fav: 0 },
    { id: 24, order: 24, name: '田村悠介', msg: '@清水 さん、はい！そうした「書き方」による感情シグナルも特徴量に含めています', time: '10:05:24', fav: 0 },
    { id: 25, order: 25, name: '西村拓海', msg: '感情に反応するってことは、ユーザの「皮肉」や「照れ」にも対応できるんでしょうか？', time: '10:05:39', fav: 0 },
    { id: 26, order: 26, name: '田村悠介', msg: '@西村 さん、現状は困難ですが、将来的に皮肉識別の補助タスクとして拡張する予定です', time: '10:05:55', fav: 0 },
    { id: 27, order: 27, name: '村田栞', msg: '学部生ですが、感情をただ分類するだけじゃなく、対話に活かしてる点がとても面白かったです！', time: '10:06:08', fav: 0 },
    { id: 28, order: 28, name: '田中美穂', msg: '@村田さん 同感。モデルの工夫より、目的との接続が明確だったのが好印象でした', time: '10:06:21', fav: 0 },
    { id: 29, order: 29, name: '竹内悠真', msg: '共同作業支援で感情に対応できるって、グループワークツールとも連携できそうですね', time: '10:06:34', fav: 0 },
    { id: 30, order: 30, name: '長谷川楓', msg: '確かに。議論支援ツールに実装されたら、だいぶ使いやすくなりそう', time: '10:06:47', fav: 0 },
    { id: 31, order: 31, name: '山本ひなた', msg: '対話のパーソナライズ設計も絡んできそう。次の展開が気になります', time: '10:07:00', fav: 0 },
    { id: 32, order: 32, name: '田村悠介', msg: '皆さまコメントありがとうございます！パーソナライズはまさに今後の焦点です', time: '10:07:13', fav: 0 },
    { id: 33, order: 33, name: '佐山真理子', msg: '対話全体の流れを感情ごとに可視化できたら、研究でも教育でも価値出そうですね', time: '10:07:26', fav: 0 },
    { id: 34, order: 34, name: '岡田誠一', msg: 'そういえば、多人数対話だとどうなるんだろう？1対1限定のモデル設計ですか？', time: '10:07:39', fav: 0 },
    { id: 35, order: 35, name: '田村悠介', msg: '@岡田 さん、今回は1対1に限定していますが、話者分離と役割分担導入で拡張を予定しています', time: '10:07:52', fav: 0 },
    { id: 36, order: 36, name: '森田一郎（教授）', msg: '1点だけ：時間変化による感情変動の捉え方は？逐次モデリングか、区間ベースか？', time: '10:08:05', fav: 0 },
    { id: 37, order: 37, name: '田村悠介', msg: '@森田先生、逐次LSTMでトレースしていますが、時間帯区切りも一部で併用しています', time: '10:08:20', fav: 0 },
    { id: 38, order: 38, name: '吉村拓郎（企業）', msg: 'この構成、社内相談ボットにも適用できそう。社内で共有してみます', time: '10:08:33', fav: 0 },
    { id: 39, order: 39, name: '井上千夏', msg: '毎度思うけど、感情×タスク文脈ってほんと奥が深い…人間って難しい', time: '10:08:46', fav: 0 },
    { id: 40, order: 40, name: '渡辺涼', msg: 'このチャット形式いいな、セッション中でもこうやって知見広がるのが理想ですね', time: '10:08:59', fav: 0 },
    { id: 41, order: 41, name: '近藤真央', msg: 'このモデル、例えば創作系の対話AIにも応用できるんでしょうか？', time: '10:09:12', fav: 0 },
    { id: 42, order: 42, name: '田村悠介', msg: '@近藤 さん、応用可能性はあると考えています。創作支援での応用は実験中です', time: '10:09:26', fav: 0 },
    { id: 43, order: 43, name: '大野慶太', msg: '意外と雑談ベースの対話でも、感情でナビゲーションされると自然になるんですよね', time: '10:09:39', fav: 0 },
    { id: 44, order: 44, name: '堀川あかり', msg: '「相手のストレス状態に応じた提案生成」って、今後さらに重要になりそう', time: '10:09:53', fav: 0 },
    { id: 45, order: 45, name: '発表者（田村悠介）', msg: '@堀川 さん、まさにそこを意識して設計しています！', time: '10:10:04', fav: 0 },
    { id: 46, order: 46, name: '三宅翔太', msg: 'やっぱり応答文のバリエーションって課題なんですかね？似たパターンに寄りがち？', time: '10:10:16', fav: 0 },
    { id: 47, order: 47, name: '田村悠介', msg: '@三宅 さん、はい、自然性を保ちつつ多様性も担保するのは課題です。今はN-best rerankingで補ってます', time: '10:10:29', fav: 0 },
    { id: 48, order: 48, name: '久保田莉子', msg: '私も似た研究してて共感…！でもここまで統合的にやってるのはすごい', time: '10:10:42', fav: 0 },
    { id: 49, order: 49, name: '山下海翔', msg: 'ユーザが不安そうなときだけ声かけてくれる設計、こっちからするとすごく「配慮」感じました', time: '10:10:56', fav: 0 },
    { id: 50, order: 50, name: '内田萌', msg: 'この「協同」って言葉、今後のヒューマンAIインタラクション系ではキーワードですね', time: '10:11:08', fav: 0 },
    { id: 51, order: 51, name: '岡本直樹', msg: '動機付け面の議論あったけど、感情に寄り添うだけで結構な差が出るの面白い', time: '10:11:21', fav: 0 },
    { id: 52, order: 52, name: '白石玲奈', msg: '発表聞いて、システムって「対話する相手」から「対話のパートナー」になってきてるなって感じました', time: '10:11:33', fav: 0 },
    { id: 53, order: 53, name: '吉村拓郎（企業）', msg: '実装まわりですが、インタラクション制御はどのレイヤーで切り分けてますか？', time: '10:11:46', fav: 0 },
    { id: 54, order: 54, name: '田村悠介', msg: '@吉村 さん、対話制御モジュールは別プロセスで管理しており、感情状態と疎結合になっています', time: '10:11:58', fav: 0 },
    { id: 55, order: 55, name: '神田英里', msg: '「ネガティブ時に沈黙を挟む」設計、実践的だなと思いました。共感の仕方が自然で', time: '10:12:12', fav: 0 },
    { id: 56, order: 56, name: '長谷川楓', msg: 'あれ、今日のチャット全体的に穏やかじゃない？このテーマのせい…？', time: '10:12:24', fav: 0 },
    { id: 57, order: 57, name: '村田栞', msg: '@長谷川さん 確かに、感情ケア系の発表は場の空気もやさしくなる説', time: '10:12:37', fav: 0 },
    { id: 58, order: 58, name: '石橋浩司（企業）', msg: 'こういうモデルが将来、チームの「空気読みボット」みたいな役割を担ったら面白いですね', time: '10:12:50', fav: 0 },
    { id: 59, order: 59, name: '中村瑞穂', msg: '@石橋 さん、Slackで空気読んで通知遅らせるBotとか…ぜひ商品化してほしい笑', time: '10:13:02', fav: 0 },
    { id: 60, order: 60, name: '田村悠介', msg: '皆さま本当に多くのコメントありがとうございました！本研究、引き続き改善していきます！', time: '10:13:14', fav: 0 }
  ],

  // メッセージの追加　id 自動生成
  addMessage: (name, message) =>
    set((state) => {
      const newId = state.messages.length + 1;
      const newOrder = state.messages[state.messages.length - 1]?.order + 1 || 1;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // 現在の時刻を取得
      const initialFav = 0; // 初期値は0

      // console.log(newId, newOrder, name, message, newTime, initialFav);
      return {
        messages: [
          ...state.messages,
          {
            id: newId,
            order: newOrder,
            name: name,
            msg: message,
            time: newTime,
            fav: initialFav,
          },
        ],
      };
    }),

  // 指定したindex のメッセージを編集
  updateMessage: (index, newMsg) =>
    set((state) => {
      const updatedMessages = [...state.messages];
      if (index >= 0 && index < updatedMessages.length) {
        updatedMessages[index] = {
          ...updatedMessages[index],
          msg: newMsg, // msg プロパティを更新
        };
      } else {
        console.warn(`Invalid index: ${index}`);
      }
      return { messages: updatedMessages };
    }),

  reorderMessages: (fromIndex, toIndex) => set((state) => {
    const updated = [...state.messages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return { messages: updated };
  }),
}));

export default useChatStore;
