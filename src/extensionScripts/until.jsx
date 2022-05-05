/**
 * 重新排列多个图层
 * @param layers 目标图层数组
 * @param callBack  对每个图层调用一次函数
 * @param args 其他参数，可以是函数，对象，数组。
 * @param bool 若为false,图层顺序自下而上，其他均为自上而下。
 */
function reorder(layers, callBack, args, bool) {
    //如果传入参数是数组且数组长度至少是2
    if (isArray(layers) && layers.length > 1) {
        var i = 0,
            len = layers.length;
        while (i < len) {
            if (empty(i)) {
                has(bool) ? (bool ? layers[i].moveToBeginning() : layers[i].moveToEnd()) : layers[i].moveToBeginning();
            } else {
                has(bool) ? (bool ? layers[i].moveAfter(layers[i - 1]) : layers[i].moveBefore(layers[i - 1])) : layers[i].moveAfter(layers[i - 1]);
            }
            if (has(callBack) && isFunction(callBack)) {
                has(args) ? callBack(layers[i], i, args) : callBack(layers[i], i);
            }
            i++
        }
        //返回处理后的所有图层
        return layers
        //如果传入参数是图层且包含此图层的合成内的所有图层数组至少2个
    } else if (isLayer(layers) && layers.containingComp.numLayers > 1) {
        var result = [];
        var j = 1;
        while (j <= layers.containingComp.numLayers) {
            result.push(layers.containingComp.layer(j))
            j++
        }
        //调用数组排序图层方法后返回包含此图层的合成内的所有图层
        return reorder(result, callBack, args, bool);
    } else {
        alert('The number of layers in the comp or array is less than two!')
    }
}
