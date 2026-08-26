import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { createConnectionPool, ConnectionPool } from './db-utils'

export function apply(ctx: Context) {
  let pool: ConnectionPool | undefined

  ctx.effect(() => {
    pool = createConnectionPool({ host: 'localhost', port: 5432 })
    // 返回的函数在插件卸载/配置变更/应用关闭时自动执行
    return () => {
      pool?.close()
      pool = undefined
    }
  })

  // 注册工具...
  ctx.tools.register(
    defineTool({
      name: 'query_database',
      description: '在 PostgreSQL 数据库中执行查询',
      parameters: {
        table_name: {
          type: 'string',
          required: true,
          description: '要查询的表名'
        },
        where_condition: {
          type: 'string',
          required: false,
          description: '可选的 WHERE 条件，例如：id > 10'
        },
        limit: {
          type: 'number',
          required: false,
          description: '返回的记录数限制，默认 10 条'
        }
      },
      output: {
        schema: { type: 'string' },
        render: async (_args, value) => {
          // 简单的格式化输出
          const formatted = value.split('\n').map(line => ({ type: 'text', text: line })).join('\n')
          return [formatted]
        },
      },
      async execute(args) {
        const { table_name, where_condition, limit = 10 } = args

        if (!pool) {
          throw new Error('数据库连接池未初始化')
        }

        try {
          // 构建查询语句
          const sql = where_condition
            ? `SELECT * FROM ${table_name} WHERE ${where_condition} LIMIT ${limit}`
            : `SELECT * FROM ${table_name} LIMIT ${limit}`

          // 执行查询
          const result = await pool.query(sql)
          const rows = result.rows

          // 格式化输出
          if (rows.length === 0) {
            return `表 ${table_name} 中没有找到数据`
          }

          // 提取列名和值
          const columns = Object.keys(rows[0])
          const columnWidths = columns.map(col =>
            Math.max(col.length, ...rows.map(row => String(row[col] ?? 'null').length))
          )

          // 格式化表头
          let output = columns.map((col, i) => col.padEnd(columnWidths[i])).join(' | ') + '\n'
          output += '-'.repeat(output.length) + '\n'

          // 格式化数据行
          output += rows.map(row =>
            columns.map((col, i) =>
              String(row[col] ?? 'null').padEnd(columnWidths[i])
            ).join(' | ')
          ).join('\n')

          output += `\n\n共找到 ${rows.length} 条记录`
          return output
        } catch (error) {
          return `查询失败: ${error instanceof Error ? error.message : String(error)}`
        }
      },
    })
  )
}