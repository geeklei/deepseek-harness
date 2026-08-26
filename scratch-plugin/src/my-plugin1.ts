import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'


//开发可被模型调用的 Tool
export const name = 'greeting-tool-plugin'
export const inject = ['tools']

export function apply(ctx: Context) {
  console.log('[greeting-tool-plugin] 插件加载成功！')

  // 注册问候工具
  ctx.tools.register(
    defineTool({
      name: 'greet',
      description: '根据指定的名字向人问好',
      parameters: {
        name: {
          type: 'string',
          required: true,
          description: '要问候的人的名字'
        },
        greeting_type: {
          type: 'string',
          required: true,
          enum: ['formal', 'casual', 'friendly'],
          description: '问候类型：formal（正式）、casual（随意）、friendly（友好）'
        }
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args) {
        const { name, greeting_type = 'friendly' } = args

        // 根据问候类型生成不同的问候语
        let greeting = ''
        switch (greeting_type) {
          case 'formal':
            greeting = `尊敬的 ${name}，您好！`
            break
          case 'casual':
            greeting = `嘿，${name}！`
            break
          case 'friendly':
          default:
            greeting = `你好，${name}！很高兴见到你！`
            break
        }

        return greeting
      },
    })
  )
}