const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { ApolloLink, Observable, gql } = require('@apollo/client')
const { loadDevMessages, loadErrorMessages } = require('@apollo/client/dev')
loadDevMessages(); loadErrorMessages()

test('shared Apollo polling pauses while hidden/offline and resumes when visible', async () => {
  const module = { exports: {} }
  const context = {
    module, exports: module.exports, require, console,
    document: { visibilityState: 'hidden' }, navigator: { onLine: true },
  }
  const code = ts.transpileModule(fs.readFileSync('src/lib/apollo-client.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  vm.runInNewContext(code, context)
  const client = module.exports.apolloClient
  let requests = 0
  client.setLink(new ApolloLink(() => new Observable(observer => {
    observer.next({ data: { unreadCount: ++requests } }); observer.complete()
  })))
  const query = client.watchQuery({ query: gql`query Unread { unreadCount }`, pollInterval: 10, fetchPolicy: 'network-only' })
  const subscription = query.subscribe({ next: () => {}, error: error => assert.fail(error.message) })
  const settle = () => new Promise(resolve => setTimeout(resolve, 50))
  try {
    await settle(); assert.equal(requests, 1, 'Initial query is allowed; background polling must stop')
    context.document.visibilityState = 'visible'
    await settle(); assert.ok(requests > 1, 'Visible online query must resume at its next interval')
    context.navigator.onLine = false
    const offlineCount = requests
    await settle(); assert.equal(requests, offlineCount, 'Offline polling must stop')
    context.navigator.onLine = true; context.document.visibilityState = 'hidden'
    const hiddenCount = requests
    await settle(); assert.equal(requests, hiddenCount, 'Hidden polling must stop again')
    delete context.document
    assert.equal(query.options.skipPollAttempt(), true, 'Server-side callback must not access browser globals')
  } finally {
    subscription.unsubscribe(); client.stop()
  }
})
