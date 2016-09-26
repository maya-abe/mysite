import printInput from './printInput'
import abeEngine from './abeEngine'

export default function printBlock (ctx) {
  var res = ''

  if(typeof ctx[0].block !== 'undefined' && ctx[0].block !== null && ctx[0].block !== '') {
    res += `<div class="form-group">
              <label class="title">${ctx[0].block}</label>
              <div class='single-block well well-sm'>`
    Array.prototype.forEach.call(ctx, (item) => {
      res += printInput(item)
    })
    res += '</div></div>'
  }else if(ctx[0].key.indexOf('[') > -1) {
    var ctxBlock = ctx[0].key.split('[')[0]
    res += `<div class="form-group">
              <div class="list-group" data-block="${ctxBlock}" >
                <label>
                  ${ctxBlock}
                  <button type="button" class="btn btn-success add-block" title="Add new block" >
                    <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
                  </button>
                </label>`
    
    var arrItem = []
    Array.prototype.forEach.call(ctx, (item) => {
      var index = item.key.match(/[^\[\]]+?(?=\])/)
      if(typeof arrItem[index] === 'undefined' || arrItem[index] === null) {
        arrItem[index] = []
      }
      arrItem[index].push(item)
    })

    Array.prototype.forEach.call(Object.keys(arrItem), (i) => {
      var key = arrItem[i][0].key.split('[')[0]
      var display = ''
      if(typeof abeEngine.instance.content[key] === 'undefined' || abeEngine.instance.content[key] === null
        || abeEngine.instance.content[key].length === 0) {
        display = 'style="display: none"'
      }
      res += `<div class="list-block" data-block="${key}${i}" ${display}>
                <button type="button" class="btn btn-info collapsed" data-toggle="collapse" data-target="#${key}${i}" >
                  Section <span class='label-count'>${i}</span> :
                  <span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
                </button>
                <button type="button" class="btn btn-danger remove-block" title="Delete block" >
                  <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
                </button>
                <div id="${key}${i}" class="collapse" >
                `
      Array.prototype.forEach.call(arrItem[i], (item) => {
        res += printInput(item)
      })
      res += '</div></div>'
    })

    res +=  `
          </div>
        </div>`
  }else {
    res += printInput(ctx[0])
  }
  return res
}
