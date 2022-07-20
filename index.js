const {
    Extension,
    type,
    api
} = require('clipcc-extension');

const toBoolean = (value) => {
    // Already a boolean?
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        // These specific strings are treated as false in Scratch.
        if ((value === '') ||
            (value === '0') ||
            (value.toLowerCase() === 'false')) {
            return false;
        }
        // All other strings treated as true.
        return true;
    }
    // Coerce other values and numbers.
    return Boolean(value);
};

class Neurons extends Extension {
    onInit() {
        api.addCategory({
            categoryId: 'shiki.neurons.category',
            messageId: 'shiki.neurons.category',
            color: '#FFAB19'
        });
        api.addBlocks([{
            opcode: 'shiki.neurons.doWhile',
            type: type.BlockType.COMMAND,
            messageId: 'shiki.neurons.doWhile',
            categoryId: 'shiki.neurons.category',
            branchCount: 1,
            param: {
                COND: {
                    type: type.ParameterType.BOOLEAN
                }
            },
            function: (args, util) => {
                let condition = false;
                if (!('isFirst' in util.thread) || util.thread.isFirst) {
                    condition = true;
                    util.thread.isFirst = false;
                } else {
                    condition = toBoolean(args.COND);
                }
                // If the condition is true (repeat WHILE), start the branch.
                if (condition) util.startBranch(1, true);
            }
        }, {
            opcode: 'shiki.neurons.warp',
            type: type.BlockType.COMMAND,
            messageId: 'shiki.neurons.warp',
            categoryId: 'shiki.neurons.category',
            branchCount: 1,
            function: (args, util) => {
                const stackFrame = util.thread.peekStackFrame();
                 if (!('isWrapped' in util.thread) || util.thread.isWrapped) {
                    util.thread.isWrapped = false;
                    stackFrame.warpMode = true;
                    util.startBranch(1, true);
                } else {
                    stackFrame.warpMode = false;
                }
            }
        }, {
            opcode: 'shiki.neurons.step',
            type: type.BlockType.COMMAND,
            messageId: 'shiki.neurons.step',
            categoryId: 'shiki.neurons.category',
            branchCount: 1,
            function: (args, util) => {
                let originalTimeElapsed = null;
                if (util.thread.warpTimer) originalTimeElapsed = util.thread.warpTimer.timeElapsed.prototype;
                else return;
                
                if (!('isStepped' in util.thread) || util.thread.isStepped) {
                    util.thread.isStepped = false;
                    util.thread.blockStepped = false;
                    // 通过覆写 warpTimer 使其每次执行时都恰巧与执行时间相差1，触发执行
                    util.thread.warpTimer.timeElapsed.prototype = () => {
                        if (util.thread.blockStepped) {
                            util.thread.blockStepped = false;
                            return 500;
                        }
                        util.thread.blockStepped = true;
                        return 499;
                    }
                    util.startBranch(1, true);
                } else {
                    util.thread.warpTimer.timeElapsed.prototype = originalTimeElapsed;
                }
            }
        }, {
            opcode: 'shiki.neurons.async',
            type: type.BlockType.COMMAND,
            messageId: 'shiki.neurons.async',
            categoryId: 'shiki.neurons.category',
            branchCount: 1,
            function: (args, util) => {
                util.startBranch(1, false);
            }
        }]);
        }

        onUninit () {
            api.removeCategory('shiki.neurons.category');
        }
    }

    module.exports = Neurons;