# GA4 (not set) 調査メモ

## コード確認

- client/index.htmlでgtag.jsを読み込み、window.dataLayerを初期化し、gtag('js', new Date())の後にgtag('config', 'G-SZHF9KKYR1')を実行している。
- configはReactのmodule scriptより先に実行され、send_page_view: falseは指定されていない。
- client/src/lib/funnelAnalytics.tsはwindow.gtagへ4イベントを送信し、product: asset-simulatorとfunnel: asset-simulatorを付与する。同時にwindow.umamiへ並行送信している。
- Home.tsxでは直接URLのフォーム表示時にsimple_input_start、計算結果表示時にsimple_result_viewまたはdetailed_result_view、詳細設定開始時にdetailed_input_startを送信する。
- App.tsxはwouterのSPAルーティングを使用するが、GA4タグ初期化を妨げる追加bootstrapやStrictModeはない。

## 本番ブラウザ確認

- 本番URLのdataLayerにconfig G-SZHF9KKYR1とsimple_input_startが存在した。
- gtagはfunctionとして存在し、GA4タグURLはhttps://www.googletagmanager.com/gtag/js?id=G-SZHF9KKYR1。
- Manus Analyticsのumamiとapi/sendも同時に読み込まれている。
- dataLayerにpage_view/session_startが見えないこと自体は異常判定の根拠にならない。自動収集イベントはgtagライブラリ内部から送られるため、dataLayerの明示的eventコマンド一覧だけでは判定できない。

## 公式仕様との照合

- GA4公式では、session source / mediumが(not set)になる代表条件は自動収集イベントsession_startが欠落している場合。
- Landing pageが(not set)になる代表条件は、そのセッションにpage_viewがない場合。
- session_startはセッションの参照元情報を運び、page_viewはランディングページ次元の基礎になる。

## 暫定結論

資産形成シミュレーターの現在の初期化順・config設定・イベント送信順には、今回の(not set)パターンを直接引き起こす明白なコード不備は確認できない。観測された「カスタムイベント・scroll・user_engagementはあるがpage_view/session_start/first_visitがない」という組み合わせは、初期自動収集イベントの欠落、同一GA4プロパティ内の別サイト（マネキャラ診断）の設定不備、同意/広告ブロッカー等による初期イベントだけの欠落、またはGA4レポートの集計遅延・スコープ混在を優先して疑う。

次の切り分けでは、GA4探索でproduct=asset-simulatorとproduct=money-characterを分離し、対象ユーザーがどちらのサイト由来かを確認する。併せてDebugViewで新しいブラウザセッションを開き、page_view→session_start→simple_input_startの順序とセッションIDの有無を確認する。コード変更はまだ行わない。
