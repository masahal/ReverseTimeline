私はすでにこのソフトウェアを開発・保守する時間がありません。引き続き開発・保守してくださる方を募集しています。

I don't have any time to develop and maintain this software. Please develop and maintain if you wish


               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                       Version 2, December 2004
     
    Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>
    
    Everyone is permitted to copy and distribute verbatim or modified
    copies of this license document, and changing it is allowed as long
    as the name is changed.
     
               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
      TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
     
     0. You just DO WHAT THE FUCK YOU WANT TO.
    
     http://www.wtfpl.net/

---------------------


Show unread tweets in reverse chronological order to read easily on twitter.
You can also apply this add-on to a list.

This add-on works on http://twitter.com/, so you can use with other useful add-ons and greasemonkey scripts.

Other functions
-Show replies from users you don't follow, too(you can turn off this setting)
-Notify new DMs, too

If you use with pbtweet+( http://userscripts.org/scripts/show/66696 ), turn off pbtweet+'s "Auto Update", "Growl Notification" options. 


ver 0.6.5.0 から Reverse Timeline は新Twitterに対応しました。しかし、新Twitterには新着発言通知機能に以下のようなバグがあります。
1.フォローしてる人が発言した直後に自分が発言してしまうとその発言が表示されません。
2.他の人のプロフィールページに切り替えた後自分のホームに戻ってくると、新着発言通知機能が働きません。
3.スタンバイから復帰した時など、大量の新着発言がある場合最新の20件しか表示されません。

まだバグが残っているかもしれませんが、問題が起こったときは、更新(F5)すればたいていは解決します。
----------------------------------------------------------------------------------------------------------------------------
Twitter で、読みやすいように未読発言を古いものから順に表示します。リストでも同様に使えます。

このアドオンは http://twitter.com/ 上で動作するため、他のアドオンやGreasemonkeyスクリプトと併用できます。

pbtweet+( http://userscripts.org/scripts/show/66696 ) と一緒に使う場合、pbtweet+ の "Auto Update", "Growl Notification" のオプションをオフにしてください。


history-------------------------------------------------------------------------------------------------------------------
ver 0.6.8.5
ver 0.6.8.2
-Fix a bug that same mention is shown repetedly
-Mark off for every 20 tweets
-同じ返信が何度も表示されてしまう問題を修正
-発言を20個ずつ区切る

ver 0.6.6.0
-Become compatible to new Twitter
-新Twitterに対応

ver 0.6.0.0
-Add "Reverse this timeline" function

-「このタイムラインを逆順にする」機能を追加

ver 0.5.5.0
-Add: "Show only the most recent n tweets" option
-Add: a link for developer
-Fix:treat a case only partial tweets can't be fetched as a case all tweets can't be fetched
-Fix:partial tweets previewed by Monkeyfly is not shown
-Fix:Move to -> Go to
-Fix: location of "Go to unread tweets" link
-Fix: open twitter.com when this add-on boot the first time
-Fix: emphasize settings link the first time
-Fix: layout of settings window

-「直近の n 件までしか表示しない」オプションを追加
-開発者へのリンクを追加
-２ページ以降の取得に失敗した場合、すべて取得できなかった場合と同じ扱いに変更
-Monkeyfly のプレビューで表示していた場合などでツイートが表示されない問題を修正
-未読部分へ移動のリンク位置を修正
-初回起動時にはTwitter のページを開くように変更
-初回は設定リンクを強調するように変更
-設定ウインドウのデザインを変更


ver 0.5.2.2
-Fix not to fetch new tweets when you post
-Fix a bug showing tweets doubly
-Change location of settings window link
-Change default value of interval of fetching new tweets: 5 -> 3
-Fix a bug that failure notification is not shown
-Fix not to fetch new tweets by halves

-投稿したときに新しい発言の取得を行わないように変更
-二重に発言が表示される問題を修正
-設定リンクの位置を変更
-失敗の通知が行われないバグを修正
-新しい発言のデフォルトのチェック間隔を5分→3分に
-新しい発言を中途半端に取得しないように修正


ver 0.5.0.0
-Disable Twitter's update notification to get tweets without omission
-Fix not to get new tweets doubly
-Fix the bug tweets color doesn't return when new tweets are fetched

-取得漏れが起きないように、Twitter自体のアップデート機能を無効化
-二重に発言を取得してしまうことがある問題を修正
-新しい発言の色を元に戻すのが失敗する問題を修正

ver 0.4.5.0
-Fix to reduce failure frequency
-Fix the bug tweets color doesn't return when new tweets are fetched
-Fix to change color of mentions from following
-Make mentions colored more deeply
-Improve settings window's design
-Fix the bug happening when there are no mentions
-Fix the position of "Move to unread tweets"
-Separate a last mention record and a last tweet record
-Update tr-TR locale

-新しい発言をちゃんと取得出来るように修正
-失敗した場合やり直す回数を１回増加
-新しい発言の色を元に戻すのが失敗する問題を修正
-返信の色を濃く
-設定ウインドウのデザインを改良
-フォローしてる人からの返信も色を変えるように
-返信がひとつもない場合のバグを修正
-「未読発言へ移動」の位置を修正
-返信の取得を新着発言のチェックと同時に行う仕様を修正
-Update tr-TR locale

 
