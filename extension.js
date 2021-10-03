// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const PseudoCodeParser = require('./lib/PseudoCodeParser.js')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate (context) {
  let currentPanel

  const parser = new PseudoCodeParser({
    delimiters: [{
      pattern: /\bperform\b/i,
      replacement: '╔══ perform',
      border: '║'
    },
    {
      pattern: /\bendperform\b/i,
      replacement: '╙──',
      border: false
    }
    ],
    extendedExpressions: [{
      pattern: /\b(perform|varying|from|by)\b/ig,
      replacement: '<span class="reserved-word">$1</span>'
    },
    {
      pattern: /\b__print-pb__\b/ig,
      replacement: '<span class="print-pb"></span>'
    }
    ]
  })
  // const myProvider = new (class {
  //   /**
  //      * @param {vscode.Uri} uri
  //      */
  //   provideTextDocumentContent (uri) {
  //     return parser.getFormattedDiagram(uri.path, true)
  //   }
  // })()
  // vscode.workspace.registerTextDocumentContentProvider('da', myProvider)

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('da.create', async () => {
    let text
    try {
      text = vscode.window.activeTextEditor.document.getText()
    } catch (e) {
      vscode.window.showWarningMessage('Da Create error : Not in a editor')
    }
    // const uri = vscode.Uri.parse('da:' + text)
    // const doc = await vscode.workspace.openTextDocument(uri)
    // await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside })
    const updateView = (input) => {
      currentPanel.webview.html = getWebViewContent(parser.getFormattedDiagram(input, true))
    }

    if (currentPanel) {
      currentPanel.reveal({ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true })
    } else {
      currentPanel = vscode.window.createWebviewPanel('da', 'DA', { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {})
      updateView(text)
      const onDidChangeEventDisposable = vscode.workspace.onDidChangeTextDocument(event => updateView(event.document.getText()))
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined
          onDidChangeEventDisposable.dispose()
        },
        null,
        context.subscriptions
      )
    }
  })

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
function deactivate () {}

module.exports = {
  activate,
  deactivate
}

function getWebViewContent (content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PseudoCode</title>
  <style>
    .pcp-highlight .diagram-title {
      color: #27ae60;
      font-weight: bold;
    }

    .pcp-highlight .quote {
      color: #e01931;
    }

    .pcp-highlight .comment,
    .pcp-highlight .comment .quote,
    .pcp-highlight .comment .reserved-word,
    .pcp-highlight .comment .keyword {
      color: #16a085;
    }

    .pcp-highlight .reserved-word {
      color: #1c57e1;
    }

    .pcp-highlight .keyword {
      color: #27ae60;
    }

    .pcp-highlight .array {
      color: #FF7416;
    }

    .pcp-highlight .whole-part {
      color: #973939;
    }

    .pcp-highlight .print-pb {
      display: block;
      width: 100%;
      height: 1px;

      background-color: #bebebe;
    }
  </style>
</head>
<body>
  <pre class="source-output pcp-highlight">${content}</pre>
</body>
</html>`
}
