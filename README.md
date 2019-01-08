# Layer-Exporter
##概要
Webデザインの画像書き出し作業の負担を軽減するために作りました。Photoshopの画像書き出しを自動化するスクリプトです。レイヤー(フォルダ)名の先頭に * (アスタリスク)のついたものだけを書き出しますので、大量のレイヤーの中から任意のものだけを書き出すことができます。フォルダ内のレイヤーの一括書き出しや解像度変更、圧縮率変更、指定エリアの書き出し、単純なスプライト生成機能なども備えています。

デザインをPhotoshopで行う場合は、スクリプトを想定して書き出したいレイヤーの名前に設定しておくと、画像書き出し作業を自動化出来ます。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image001.gif)


##使用方法

スクリプト本体の layer-exporter.jsx とサンプルPSDが表示されます。
Photoshoを起動し、「ファイル > スクリプト > 参照」にて、layer-exporter.jsxを読み込みます。

以下の場所にスクリプトファイルを保存することで、スクリプトのメニューに追加することもできます。再起動することでスクリプトメニューに表示されます。

````アプリケーション/Adobe Photoshop (バージョン名)/Presets/Scriptｓ/````

#メニュー
スクリプトを起動すると以下のメニューが表示されます。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image002.png)

メニューは大きく5つのエリアに分かれています。

| エリア名 | 説明 |
|:--|:--|
|  SEARCH EXPORT |レイヤー名を検索する範囲を決めます。  |
| QUICK EXPORT  | レイヤーパネルで選択中のレイヤーを書き出します。  |
|  CHILD LAYERS |  フォルダ内書き出し時の設定を変更でいきます。 |
| SPRITE  | スプライトの位置・寸法情報を記した画像を出力します。  |
|  QUALITY |  書き出し時の画像の圧縮率を指定できます。 |

先に基本となる「すべての「*」を検索」で機能を解説します。(各メニューの詳細は記事の最後のほうに説明します。)
(スクリプトには「\*>」でフォルダ内のレイヤーをフォルダ名で連番書き出しや、「\*/」でフォルダ内のレイヤーを子レイヤー名で書き出しなどのキーワードがありますが、書き出されるものは「\*」から始まるとおぼえてください。)

#レイヤー書き出し
スクリプトはすべてのレイヤー名から先頭に「*」のついたレイヤーを探し出して書き出します。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image003.png)
上記の場合、「\*illust_eye_left」レイヤーだけを書き出します。書き出しの際は「\*」が取り除かれたレイヤー名になり、デフォルトでpngで書き出します。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image004.png)

#フォルダ書き出し
フォルダ名の先頭に「\*」がある場合は、そのフォルダ内の全てのレイヤーを__1つの画像__で書き出します。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image005.png)

#書き出しディレクトリ指定
*のついたレイヤー名を/(スラッシュ)で区切ると、書き出すフォルダを指定できます。存在しない場合は新規に作ります。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image006.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image007.png)


#フォルダ内の子レイヤーをフォルダ名で書き出し
フォルダの子レイヤーを書き出す場合、フォルダ名の先頭を「\*>」にすることで、子レイヤーを全て書き出すことができます。陳列画像などはフォルダにまとめておき、この機能を使うことで、1つ1つのレイヤー名を変更する手間も省いて、複数のレイヤーを一度に書き出すことができます。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image008.png)
上記、フォルダ内のレイヤーは「layer番号」という名前ですが、書き出しはフォルダ名+連番になっていることに注目してください。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image009.png)

#フォルダ内の子レイヤーを自身のレイヤー名で書き出し
フォルダ名の先頭を「\*/」にすると、子レイヤーは自身のレイヤー名で書き出されます。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image010.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image011.png)

#解像度の変更
レイヤー名の__末尾__に````(数値+%またはwまたはh)````を付けると、画像の比率を保ったまま指定したサイズに変更して書き出します。

##記述サンプル
| キーワード | 説明 |
|:--|:--|
| レイヤー名(150%)  |  150%に拡大 |
|  レイヤー名(150h) |  高さが150pxになるように画像の比率を保ってサイズ変更 |
|  レイヤー名(100w) |  幅が100pxになるように画像の比率を保ってサイズ変更 |

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image012.png)
上記を書き出すと以下のようになります。画像は解像度が変更されてもクオリティを保つために、ある程度の解像度のものをスマートオブジェクトに変換してPhotoshopに配置すると良いでしょう。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image013.png)

##フォルダ書き出し + 解像度変更
フォルダ書き出しと組み合わせて、フォルダ名の末尾に追加すると、子レイヤーをすべて指定サイズに変更して書き出します。フォルダ内の画像をサムネイル化して書き出したい時などに利用できます。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image014.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image015.png)
150%に拡大されて３つ書き出されました。ファイル名がフォルダ名になっていることを確認してください。

この指定は*/(フォルダ内をレイヤー自身の名前で書き出し)でも有効です。

#jpg書き出し
ファイル名(フォルダ名)の末尾に````.jpg````を付けると、画像はjpg形式で書き出されます。画質は初期メニューの QOLITY で指定したものになります。(デフォルトで80)

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image016.png)
上記の場合、フォルダ書き出しと組み合わせて使用しています。フォルダ名には子レイヤーをレイヤー自身の名前で書き出す指定である */photos が書かれているのに注目してください。

子レイヤーは名前の通り、以下のように書き出されます。

| レイヤー名 | 説明 |
|:--|:--|
| photo_night.jpg  |  QUILITYで指定した圧縮率が適用されます。 |
| photo_space.jpg(60)  |  jpgの画質は60になります。 |
| photo_galaxy(300%).jpg(70)  |  解像度変更との組み合わせです。300%の大きさでjpgになり、画質は70になります。 |

##フォルダ内書き出しとの組み合わせ
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image017.png)
「フォルダ内をフォルダ名で書き出し」と組み合わせると、子レイヤーに一括して指定できます。上記の場合は、50%の大きさでjpg形式、画質90でフォルダ内をphotos(連番)で書き出します。

#スプライト画像の出力

ある2つのレイヤー名の__先頭__に{小英字}と{大英字}を書くことで、そのレイヤーはスプライトのセットとして書き出されます。

次の画像は、３つのアイコンの通常状態とマウスカーソルが乗った状態(明度を上げた画像)とが、````{a}````は````{A}````、````{b}````は````{B}````、````{c}````は````{C}````と対になって重ねて配置されています。(重なって配置する必要はありませんが、通常このように作ることが多いと思います。)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image018.png)
下は書き出された画像
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image019.png)
スプライト画像は１枚にまとめられます。この際、画像名は{a}のものが使用されます。CSSのbackground-posiitonプロパティを利用して、 top と bottomで切り替える使用法を想定した作りになっています。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image020.png)

初期メニューの SPRITE の項目で、「スプライトマップの書き出し」にチェックが入っていると、同時に上のような各画像の寸法やx座標の位置を記した_SPRITE_MAP_が出力されます。この画像には、CSSで画像の幅や高さ、位置を指定する際に必要な寸法が表記されています。画像上部にある黒い背景の数値は左端を0としたときの各スプライトのx位置です。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image021.png)

スプライトとなる画像の位置やレイヤー順序(重なり順序)は関係ありません。上のように別の箇所にあるレイヤーで、配置がバラバラでであっても、同じグループのスプライト画像は1つにまとめられます。この場合でも先に紹介したのと同じスプライト画像が生成されます。

##スプライトが複数セットがある場合
スプライトのセットであることを示す(英字)のあとに数値を追記してください。````{a1}````は````{A1}````とセットになり、````{b1}````と````{B1}````のセットは````{a1}````とのグループとして１枚の画像になります。````{a2}````は````{A2}````とセットになり、````{b2}````と````{B2}````、````{c2}````と````{C2}````の同じグループとしてa1のグループとは別の画像にまとめられ、この場合、合計で２枚のスプライト画像が書き出されます。

※注意 {a}{A}は１枚だけの時の数字の省略形で、スクリプトの処理としては{a1}として扱っていますので、もし別グループの次のスプライトを作る場合は{a2}からはじまります。{a}{A}がある場合に{a1}{A1}を作ると上書きされてしまうので、もし複数作られる予定であれば{a1}{A1}と最初から英字と数字を合わせた名前を利用してください。

#エリア書き出し「!」
スクリプトは画像の透明部分をトリミングして書き出されますが、透明範囲を残して書き出したい場合は、書き出したい領域を示した矩形のあるレイヤーを用意して、そのレイヤー名の先頭に````!````を入れて書き出す画像とリンクさせます。

##通常は透明部分はトリミングして書き出される。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image022.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image023.png)

##エリア指定のサンプル
書き出すレイヤーとは別に、書き出す領域を矩形で記したレイヤーを用意し、レイヤー名の先頭に````!````をつけてリンクします。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image024.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image025.png)
先ほどと違い、saturn2.pngでは指定エリアの大きさで透明部分も書き出されています。

##サンプル2
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image026.png)
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image027.png)

##サンプル3
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image028.png)
３つの````cat_boyレイヤー````はそれぞれ````1つの!AREAレイヤー````をリンクして共有しています。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image029.png)
画像はエリアレイヤーの矩形の領域を書き出していることがわかります。

#一緒に書き出す 「&」 指定
レイヤーと一緒に書き出したいレイヤーがある場合は、一緒に書き出したいレイヤーの名前の先頭に````&````を付けてレイヤーをリンクさせます。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image030.png)
上の画像は、catとdogをそれぞれ````&WITH````レイヤーにリンクさせています。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image031.png)
ある画像を背景レイヤーと一緒に書き出したい時などに利用できます。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image032.gif)
注意: 一緒に書き出せる&レイヤーは１枚だけです。&を付けた複数のレイヤーを書き出す事はできません。その場合はフォルダ内書き出し等、他の方法を選択してください。

#メニューの解説
##SEARCH EXPORTメニュー
一部のレイヤーを更新した場合など、検索範囲を指定することで他の画像の書き出しはせずに、選択中のレイヤーやフォルダ内部を改めて書き出すことができます。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image033.png)

| 項目 | 説明 |
|:--|:--|
| すべての「\*」を検索  | ドキュメントの全てのレイヤーから「\*」を検索して書き出します。  |
| 選択中のレイヤー範囲 | レイヤーパネルで選択状態のフォルダの内部の「*」を検索して書き出します。 |
| スプライトのみ  |  ドキュメント内の全てのレイヤーからスプライト指定のあるものを書き出します。 |
| \*のレイヤー内部も検索  |  フォルダ名に\*が付いている場合でも、フォルダ書き出しとは別に、内部のレイヤーの*を書き出します。 |
|  書き出し後にレイヤー名を修正 |  書き出した後に、レイヤー名からスクリプトの指定記述を削除します。 |

##QUICK EXPORTメニュー
\*の指定がなくても、レイヤーパネルで選択中のレイヤーやフォルダを書き出します。ボタンを押すとすぐに実行されるので、あらかじめレイヤーパネルから書き出したいレイヤーを選択する必要があります。

| 項目 | 説明 |
|:--|:--|
|  書き出し |  選択中のレイヤーを書き出し |
|  グループ内を親名前連番 | フォルダグループを選択して実行すると、フォルダ名+連番で子レイヤーを書き出します。(>\*と同じ機能)  |
|  フォルダグループを選択して実行すると、内包する子レイヤーをレイヤー自身の名前で書き出します。(\*/と同じ機能) |   |

##CHILD LAYERSメニュー
\*>で書き出す際に、子レイヤーのファイル名や順番を指定できます。

| 項目 | 説明 |
|:--|:--|
|  ファイル名の桁数 | 2で01、3で001からはじまる番号になります。  |
|  昇順・降順 | フォルダ内部の子レイヤーを上から順に番号をふるか、下から順に番号を降るかを選べます。  |
| 不可視レイヤーは無視  |  通常、不可視レイヤーでも\*がついていれば書き出しますが、チェックをいれると無視します。 |

##SPRITE
| 項目 | 説明 |
|:--|:--|
| スプライトマップを書き出し  | スプライト生成時、同時に画像の位置や寸法情報を記した画像を生成します。  |

#QUALITY
| 項目 | 説明 |
|:--|:--|
|  JPG |  Web用に保存の際に指定できるjpgの画質を指定できます。 101にすることでPhotoshopの「別名で保存」と同じ形式でjpg保存します。
|  Tiny Pluginで書き出す | [TinyPNG plugin](https://tinypng.com/photoshop)がインストールされてる場合に利用できます。有効にすることでpngとjpgはTinyPNGプラグインで書き出されます。  |


#その他、特筆事項

##スナップショットで処理前に戻る
スクリプトを実行すると、書き出し処理の前にスナップショット(ドキュメント状態の保存)を実行します。書き出しがすべて終わると、最初に実行したスナップショットを復元し、書き出し処理直前の状態に戻ります。
![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image034.png)

スクリプトの実行中に問題が起きて途中で処理が止まった場合、ドキュメントのレイヤーの並びや名前が元の状態と変わっている可能性がありますので、その場合はヒストリーパネルからスナップショットを復元してください。

##スクリプトは何をしているか
スクリプトを実行すると、スナップショットを実行後に、ドキュメントの全てのレイヤー名から\*、\*>、\*/のついたものを検索し、見つけたらそのレイヤーの情報を書き出しリストに追加します。検索が終わると、書き出しリストにあるレイヤーを順にスマートオブジェクトに変換して書き出し、１つ書き出し終わるとスナップショットで最初に戻り、次のリストのレイヤーをスマートオブジェクトに変換、書き出し、と繰り返します。全てのレイヤーの書き出しが終わると、スプライト画像のリストを見て、存在していた場合はスプライト画像の生成に移ります。その後にスプライトマップを生成します。すべての処理が終わると、スナップショットを復元して処理の直前の状態に戻ります。スクリプトが正常に終了すればドキュメントには何も影響を与えません。

重いPhotoshopデータであっても実行速度を早めるために、このような手順になっています。

##サンプルPSD
ここで紹介した機能を確認するためのサンプルとなるPSDデータを同梱しています。このPSDドキュメントのレイヤーには一通りの機能を再現するために編集されていますのでお試しください。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image035.png)

#初期設定の変更
スクリプトをテキストエディターで開くと、冒頭にメニューの初期設定に関する項目があります。この値を変更することで、開くメニューの初期状態を変更できます。

![image](https://raw.githubusercontent.com/w4u-public/Layer-exporter/images/image036.png)

##免責事項

+ ライセンス: MIT
+ 業務で利用する場合は十分なテストの上でご使用ください。本スクリプトによって生じたいかなる損害に対して、当方は一切の責任を負いかねます。


