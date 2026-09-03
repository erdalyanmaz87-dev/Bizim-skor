const assert=require('assert');
const ui=require('./chat-unread-indicator.js');

assert.equal(ui.shouldMarkUnread({messagePlayer:'Ayşe',currentPlayer:'Erdal',chatOpen:false}),true);
assert.equal(ui.shouldMarkUnread({messagePlayer:'Erdal',currentPlayer:'Erdal',chatOpen:false}),false);
assert.equal(ui.shouldMarkUnread({messagePlayer:'ERDAL',currentPlayer:'erdal',chatOpen:false}),false);
assert.equal(ui.shouldMarkUnread({messagePlayer:'Ayşe',currentPlayer:'Erdal',chatOpen:true}),false);
assert.equal(ui.shouldMarkUnread({messagePlayer:'Ayşe',currentPlayer:'',chatOpen:false}),true);
console.log('chat unread indicator ok');
