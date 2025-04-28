// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

/**
 * 座標パターンをターゲットセレクタ引数形式に変換する関数
 * @param selector ターゲットセレクタ（@e, @a, @p, @r, @s）
 * @param x X座標
 * @param y Y座標
 * @param z Z座標
 * @returns 変換後のテキスト
 */
function convertToTargetSelectorArgs(selector: string, x: string, y: string, z: string): string {
	return `${selector}[x=${x},y=${y},z=${z}]`;
}


/**
 * 座標パターンをターゲットセレクタ引数形式に変換する関数（範囲指定あり）
 * @param selector ターゲットセレクタ（@e, @a, @p, @r, @s）
 * @param x1 始点のX座標
 * @param y1 始点のY座標
 * @param z1 始点のZ座標
 * @param x2 終点のX座標
 * @param y2 終点のY座標
 * @param z2 終点のZ座標
 * @returns 変換後のテキスト
 */
function convertToTargetSelectorArgsWithRange(selector: string, x1: string, y1: string, z1: string, x2: string, y2: string, z2: string): string {
	
	// 座標の大小関係を考慮
	let x1Num = parseInt(x1);
	let y1Num = parseInt(y1);
	let z1Num = parseInt(z1);
	let x2Num = parseInt(x2);
	let y2Num = parseInt(y2);
	let z2Num = parseInt(z2);
	
	// dx, dy, dz が負の値にならないように座標を入れ替え
	if (x1Num > x2Num) { [x1Num, x2Num] = [x2Num, x1Num]; [x1, x2] = [x2, x1]; }
	if (y1Num > y2Num) { [y1Num, y2Num] = [y2Num, y1Num]; [y1, y2] = [y2, y1]; }
	if (z1Num > z2Num) { [z1Num, z2Num] = [z2Num, z1Num]; [z1, z2] = [z2, z1]; }
	
	// dx, dy, dz を計算（終点 - 始点）
	const dx = x2Num - x1Num;
	const dy = y2Num - y1Num;
	const dz = z2Num - z1Num;

	return `${selector}[x=${x1},y=${y1},z=${z1},dx=${dx},dy=${dy},dz=${dz}]`;
}

/**
 * 座標変換補完プロバイダークラス
 * 選択されたテキスト内のターゲットセレクタ引数の座標パターンを検出し、Minecraft形式の座標に変換する候補を提供します
 */
class CoordinateCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		// .mcfunction ファイル以外では候補を表示しない
		// ファイルの拡張子で判断する
		if (!document.fileName.endsWith('.mcfunction')) {
			return [];
		}

		// 現在の選択範囲を取得
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return [];
		}

		const selection = editor.selection;
		if (selection.isEmpty) {
			return [];
		}

		// 選択されたテキストを取得
		const selectedText = document.getText(selection);

		const completionItems: vscode.CompletionItem[] = [];

		// ターゲットセレクタ引数の中の座標パターンを検出
		// @c[/fill 111 200 333 100 222 300] のようなパターンを検出（6つの数値）
		const patternSelector6 = /(@[eaprsc])\[(?:\/(?:fill|setblock|tp|teleport|summon|execute|clone)\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\]/g;
		let matchSelector6;
		while ((matchSelector6 = patternSelector6.exec(selectedText)) !== null) {
			let [fullMatch, selector, x1, y1, z1, x2, y2, z2] = matchSelector6;
			
			// 変換候補を作成
			const convertedText = convertToTargetSelectorArgsWithRange(selector, x1, y1, z1, x2, y2, z2);
			const completionItem = new vscode.CompletionItem(
				`${fullMatch} → ${convertedText}`,
				vscode.CompletionItemKind.Snippet
			);
			
			// 置換テキストを設定
			completionItem.insertText = convertedText;
			completionItem.detail = 'ターゲットセレクタ引数に変換（6つの数値）';
			completionItem.documentation = new vscode.MarkdownString(
				`「${fullMatch}」を「${convertedText}」に変換します。`
			);
			
			completionItems.push(completionItem);
		}

		// ターゲットセレクタ引数の中の座標パターンを検出
		// @c[/fill 333 555 2] のようなパターンを検出（3つの数値）
		const patternSelector3 = /(@[eaprsc])\[(?:\/(?:fill|setblock|tp|teleport|summon|execute|clone)\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\]/g;
		let matchSelector3;
		while ((matchSelector3 = patternSelector3.exec(selectedText)) !== null) {
			let [fullMatch, selector, x, y, z] = matchSelector3;
			
			// 変換候補を作成
			const convertedText = convertToTargetSelectorArgs(selector, x, y, z);
			const completionItem = new vscode.CompletionItem(
				`${fullMatch} → ${convertedText}`,
				vscode.CompletionItemKind.Snippet
			);
			
			// 置換テキストを設定
			completionItem.insertText = convertedText;
			completionItem.detail = 'ターゲットセレクタ引数に変換（3つの数値）';
			completionItem.documentation = new vscode.MarkdownString(
				`「${fullMatch}」を「${convertedText}」に変換します。`
			);
			
			completionItems.push(completionItem);
		}

		return completionItems;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "mc-coordinate-completion" is now active!');

	// 座標変換コマンドを登録
	// .mcfunctionファイルでのみ有効なコマンドとして登録
	const convertCommand = vscode.commands.registerTextEditorCommand('mc-coordinate-completion.convertCoordinates', (editor, edit) => {

		// .mcfunction ファイル以外では機能しない
		// ファイルの拡張子で判断する
		if (!editor.document.fileName.endsWith('.mcfunction')) {
			vscode.window.showInformationMessage('この機能は .mcfunction ファイルでのみ使用できます');
			return;
		}

		const selections = editor.selections;
		let changesMade = false;

		editor.edit(editBuilder => {
			for (const selection of selections) {
				if (selection.isEmpty) {
					continue;
				}

				// 選択されたテキストを取得
				const document = editor.document;
				const selectedText = document.getText(selection);

				// ターゲットセレクタ引数の中の座標パターンを検出
				// @c[/fill 111 200 333 100 222 300] のようなパターンを検出（6つの数値）
				// グローバル検索(/g)で選択範囲内のすべてのマッチを処理
				const patternSelector6 = /(@[eaprsc])\[(?:\/(?:fill|setblock|tp|teleport|summon|execute|clone)\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\]/g;
				let matchSelector6;
				let lastIndex6 = 0;
				let replacedText6 = selectedText;
				let offset6 = 0; // オフセットを追跡

				while ((matchSelector6 = patternSelector6.exec(selectedText)) !== null) {
					let [fullMatch, selector, x1, y1, z1, x2, y2, z2] = matchSelector6;
					
					
					// 変換処理
					const convertedText = convertToTargetSelectorArgsWithRange(selector, x1, y1, z1, x2, y2, z2);
					
					// マッチした部分の範囲を計算
					const matchStartIndex = matchSelector6.index + offset6;
					const matchEndIndex = matchStartIndex + fullMatch.length;
					const startPos = selection.start.translate(0, matchStartIndex);
					const endPos = selection.start.translate(0, matchEndIndex);
					const replaceRange = new vscode.Range(startPos, endPos);

					// 選択されたテキストを変換したテキストで置き換え
					editBuilder.replace(replaceRange, convertedText);
					changesMade = true;

					// オフセットを更新
					offset6 += convertedText.length - fullMatch.length;
				}

				// ターゲットセレクタ引数の中の座標パターンを検出
				// @c[/fill 333 555 2] のようなパターンを検出（3つの数値）
				// グローバル検索(/g)で選択範囲内のすべてのマッチを処理
				const patternSelector3 = /(@[eaprsc])\[(?:\/(?:fill|setblock|tp|teleport|summon|execute|clone)\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\]/g;
				let matchSelector3;
				let lastIndex3 = 0;
				let replacedText3 = selectedText; // 6の置換後のテキストを使うべきだが、範囲がずれるため一旦元のテキストで計算
				let offset3 = 0; // オフセットを追跡

				while ((matchSelector3 = patternSelector3.exec(selectedText)) !== null) {
					// 6つの数値パターンで既に処理されていないか簡易チェック（より厳密なチェックが必要な場合あり）
					// このチェックは不完全な可能性があるため注意
					const checkPattern6 = /(@[eaprsc])\[(?:\/(?:fill|setblock|tp|teleport|summon|execute|clone)\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\]/g; // gフラグを追加
					if (checkPattern6.test(matchSelector3[0])) {
						continue;
					}

					let [fullMatch, selector, x, y, z] = matchSelector3;
					
					// 変換処理
					const convertedText = convertToTargetSelectorArgs(selector, x, y, z);
					
					// マッチした部分の範囲を計算
					const matchStartIndex = matchSelector3.index + offset3; // オフセットを考慮
					const matchEndIndex = matchStartIndex + fullMatch.length;
					const startPos = selection.start.translate(0, matchStartIndex);
					const endPos = selection.start.translate(0, matchEndIndex);
					const replaceRange = new vscode.Range(startPos, endPos);

					// 選択されたテキストを変換したテキストで置き換え
					editBuilder.replace(replaceRange, convertedText);
					changesMade = true;

					// オフセットを更新
					offset3 += convertedText.length - fullMatch.length;
				}
			}
		}).then(success => {
			if (!success) {
				vscode.window.showErrorMessage('座標の変換に失敗しました。');
			} else if (!changesMade) {
				vscode.window.showInformationMessage('変換可能な座標パターンが見つかりませんでした');
			}
		});
	});

	// 補完プロバイダーを登録
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		{ pattern: '**/*.mcfunction' }, // .mcfunctionファイルのみで有効
		new CoordinateCompletionProvider()
		// トリガー文字を指定しないことで、テキストが貼り付けられたときにも補完が表示される
	);

	context.subscriptions.push(convertCommand, completionProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
