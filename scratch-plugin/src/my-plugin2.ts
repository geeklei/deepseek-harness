import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'


// 插件配置与热更新
export const name = 'greet-tool'
export const inject = ['tools']

export interface Config {
  greeting: string
  emoji: boolean
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  emoji: Schema.boolean().default(true),
})

export function apply(ctx: Context, config: Config) {
  console.log('[greeting-tool] 插件加载成功！')

  ctx.tools.register(defineTool({
    name: 'greet2',
    description: '根据名字向人问好。',
    parameters: {
      name: { type: 'string', required: true, description: '要问候的名字' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const suffix = config.emoji ? ' 👋' : ''
      return `${config.greeting}, ${args.name}!${suffix}`
    },
  }))
}