<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Markdown 语法介绍</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
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
        <div class="external-link">
          <a href="https://markdown.com.cn/basic-syntax/" target="_blank" rel="noopener">
            查看完整语法 &rarr; markdown.com.cn/basic-syntax/
          </a>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  padding: 0 4px;
}
.close-btn:hover {
  background: var(--bg-tertiary);
}
.modal-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
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
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}
</style>
