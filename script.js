const http = new XMLHttpRequest()
var data
var output = ''
var style = 0
var escapeNewLine = false
var spaceComment = false

const onDocumentReady = () => {
  document.getElementById('url-field').value = getQueryParamUrl()
  if (getFieldUrl()) {
    startExport()
  }
}

const getQueryParamUrl = () =>
  new URLSearchParams(window.location.search).get('url') ?? null
const getFieldUrl = () => document.getElementById('url-field').value

function fetchData(url) {
  output = ''

  http.open('GET', `${url}.json`)
  http.responseType = 'json'
  http.send()

  http.onload = function () {
    data = http.response
    const post = data[0].data.children[0].data
    const comments = data[1].data.children
    displayTitle(post)
    output += '\n\n## Comments\n\n'
    comments.forEach(displayComment)

    console.log('Done')
    const outputDisplay = document.getElementById('output-display')
    const outputBlock = document.getElementById('output-block')
    outputBlock.removeAttribute('hidden')
    outputDisplay.innerHTML = `<pre>${output}</pre>`
    document.getElementById('copy-button').removeAttribute('hidden')
    download(output, 'output.md', 'text/plain')
  }
}

function setStyle() {
  style = document.getElementById('treeOption').checked ? 0 : 1
  escapeNewLine = document.getElementById('escapeNewLine').checked
  spaceComment = document.getElementById('spaceComment').checked
}

function startExport() {
  console.log('Start exporting')
  setStyle()

  var url = getFieldUrl()
  if (url) {
    fetchData(url)
  } else {
    console.log('No url provided')
  }
}

function download(text, name, type) {
  const a = document.getElementById('a')
  a.removeAttribute('disabled')
  const file = new Blob([text], { type: type })
  a.href = URL.createObjectURL(file)
  a.download = name
}

function copyToClipboard() {
  const text = output
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert('Markdown copied to clipboard!')
    })
    .catch((err) => {
      console.error('Could not copy text: ', err)
    })
}

function displayTitle(post) {
  output += `# ${post.title}\n`
  if (post.selftext) {
    output += `\n${post.selftext}\n`
  }
  output += `\n[permalink](http://reddit.com${post.permalink})`
  output += `\nby *${post.author}* (↑ ${post.ups}/ ↓ ${post.downs})`
}

function formatComment(text) {
  return escapeNewLine ? text.replace(/(\r\n|\n|\r)/gm, '') : text
}

function displayComment(comment, index) {
  let depthTag =
    style == 0
      ? '─'.repeat(comment.data.depth)
      : '\t'.repeat(comment.data.depth)
  output += depthTag
    ? `${depthTag}${style == 0 ? '├' : '-'} `
    : `${style == 0 ? '##### ' : '- '}`

  if (comment.data.body) {
    output += `${formatComment(comment.data.body)} ⏤ by *${
      comment.data.author
    }* (↑ ${comment.data.ups}/ ↓ ${comment.data.downs})\n`
  } else {
    output += 'deleted \n'
  }

  if (comment.data.replies) {
    comment.data.replies.data.children.forEach(displayComment)
  }

  if (comment.data.depth === 0 && comment.data.replies) {
    if (style == 0) {
      output += '└────\n\n'
    }
    if (spaceComment) {
      output += '\n'
    }
  }
}
