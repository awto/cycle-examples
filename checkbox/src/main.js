import Cycle from '@cycle/core';
import {div, input, p, makeDOMDriver} from '@cycle/dom';
const M = require('@mfjs/core');
const RxM = require('@mfjs/rx')(require('rx'));
M.profile('defaultMinimal');
M.option({minimal:{CallExpression:{match:{postfix:{M:true}}}}});

function main(sources) {
  function toggledM() {
    M.answer(false);
    return M(sources.DOM.select('input').events('change')).target.checked;
  }
  let sinks = {
      DOM: RxM.run(() =>
        div([
          input({type: 'checkbox'}),
          'Toggle me',
          p(toggledM() ? 'ON' : 'off')
        ]))
  };
  return sinks;
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
