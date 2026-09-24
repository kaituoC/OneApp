<template>
  <AppDialog :open="true" title="Markdown 语法介绍" dismiss-on-backdrop @close="$emit('close')">
        <table class="syntax-table">
          <thead>
            <tr>
              <th>语法</th>
              <th>示例</th>
              <th>效果</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>一级标题</td><td><code># 标题</code></td><td>大标题</td></tr>
            <tr><td>二级标题</td><td><code>## 标题</code></td><td>中标题</td></tr>
            <tr><td>加粗</td><td><code>**文本**</code></td><td><strong>加粗文本</strong></td></tr>
            <tr><td>斜体</td><td><code>*文本*</code></td><td><em>斜体文本</em></td></tr>
            <tr><td>无序列表</td><td><code>- 列表项</code></td><td>&bull; 列表项</td></tr>
            <tr><td>有序列表</td><td><code>1. 列表项</code></td><td>1. 列表项</td></tr>
            <tr><td>代码块</td><td><code>```代码```</code></td><td>代码块</td></tr>
            <tr><td>链接</td><td><code>[文字](URL)</code></td><td>可点击链接</td></tr>
            <tr><td>图片</td><td><code>![描述](URL)</code></td><td>显示图片</td></tr>
            <tr><td>引用</td><td><code>> 引用文本</code></td><td>引用块</td></tr>
          </tbody>
        </table>
    <div class="external-link"><button @click="openGuide">查看完整语法 ↗</button></div>
    <template #footer><button data-dialog-focus @click="$emit('close')">关闭</button></template>
  </AppDialog>
</template>
<script setup>
import AppDialog from './AppDialog.vue'
defineEmits(['close'])
function openGuide() { window.electronAPI.openExternal('https://markdown.com.cn/basic-syntax/') }
</script>
<style scoped>
.syntax-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.syntax-table th, .syntax-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
}
.syntax-table th {
  background: var(--bg-tertiary);
}
.external-link {
  margin-top: 16px;
  text-align: center;
}
.external-link a {
  color: var(--accent);
  text-decoration: none;
}
.external-link a:hover {
  text-decoration: underline;
}
</style>
