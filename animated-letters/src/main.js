import Cycle from '@cycle/core'
import {Observable} from 'rx'
import {div, ul, li, makeDOMDriver} from 'cycle-snabbdom'
import {intersection, difference, sortBy} from 'lodash'
const M = require('@mfjs/core')
const RxM = require('@mfjs/rx')({latest:true})
M.profile('defaultMinimal')

function intent(keydownSource) {
  let e = M(keydownSource)
  let str = e.code.replace('Key', '')
  if (str.length === 1)
    return str;
  else
    return M(M.empty())
}

function model(action$) {
  M.answer([])
  let state = ["A"]
  M.answer(state.slice())
  const key = M(action$)
  const index = state.indexOf(key)
  if (index !== -1)
    state.splice(index, 1)
  else {
    state.push(key)
    state.sort()
  }
  return state.slice();
}

function determineDeltaPoints(state$) {
  let [before, after] = M(state$.pairwise());
  const addedPoints = difference(after, before).map(key =>
      ({key, value: 0, target: 1})
    )
  const removedPoints = difference(before, after).map(key =>
      ({key, value: 1, target: 0})
    )
  const points = addedPoints.concat(removedPoints)
  const res =  M(Observable.from(sortBy(points, 'key')));
  return res
}

function expandAsRenderingFrames(point$) {
  const point = M(point$)
  M(Observable.interval(10).take(100))
  return point
}

function calculateAnimationSteps(point$) {
  function incorporateNewPoint(oldPoints, newPoint) {
    const index = oldPoints.findIndex(point => point.key === newPoint.key)
    let points
    if (index === -1 && newPoint.target === 1) {
      points = oldPoints.concat(newPoint)
    } else {
      points = oldPoints.slice()
      points[index] = newPoint
    }
    return points
  }

  function progressEachPoint(oldPoints, newPoints) {
    return newPoints.map(newPoint => {
      const target = newPoint.target
      const oldPoint = oldPoints.find(p => p.key === newPoint.key)
      const value = !!oldPoint ? oldPoint.value : newPoint.value
      return {
        ...newPoint,
        value: (Math.abs(target - value) < 0.01) ?
          target :
          value + (target - value) * 0.05
      }
    })
  }
  M.ref(acc)
  let acc = []
  const point = M(point$)
  const newAcc = incorporateNewPoint(acc, point)
  const progressedAcc = progressEachPoint(acc, newAcc)
  const sanitizedAcc = progressedAcc.filter(point =>
      !(point.target === 0 && point.value === 0))
  return acc = sortBy(sanitizedAcc, 'key')
}

function animate(state$) {
  return state$
    .let(determineDeltaPoints)
    .let(expandAsRenderingFrames)
    .let(calculateAnimationSteps)
}

function view(state$) {
  const animatedState$ = animate(state$)
  const ulStyle = {padding: '0', listStyle: 'none', display: 'flex'}
  const liStyle = {fontSize: '50px'}
  const animStates = M(animatedState$)
  return ul({style: ulStyle}, animStates.map(animState => 
                                             li({style: {fontSize: `${animState.value * 50}px`}}, animState.key)
  ))
}

function main(sources) {
  const key$ = RxM.run(() => intent(sources.Keydown))
  const state$ = RxM.run(() => model(key$))
  const vtree$ = RxM.run(() => view(state$))
  return {
    DOM: vtree$,
  }
}

Cycle.run(main, {
  Keydown: () => Observable.fromEvent(document, 'keydown'),
  DOM: makeDOMDriver('#main-container')
})
