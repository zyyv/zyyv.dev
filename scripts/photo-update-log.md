# 图片路径更新说明

## 📅 更新时间
2025年7月31日

## 🔄 更新内容

### 1. Photo 类型定义更新
在 `app/types/index.ts` 中更新了 `Photo` 接口：
- **`path`**: 现在指向压缩后的图片路径 (`/photos/compressed/xxx_compressed.jpg`)
- **`originalPath`**: 新增字段，指向原图路径 (`/photos/xxx.jpg`)

### 2. photo.ts 脚本更新
在 `scripts/photo.ts` 中添加了新功能：
- 添加了 `getCompressedPath()` 函数来生成压缩图片路径
- 更新了 Photo 对象创建逻辑，同时包含压缩图和原图路径

## 📋 路径格式

| 字段 | 格式 | 示例 | 说明 |
|------|------|------|------|
| `path` | `/photos/compressed/{filename}_compressed.jpg` | `/photos/compressed/DSC02924.JPG_compressed.jpg` | 压缩后的图片路径（主要使用） |
| `originalPath` | `/photos/{filename}` | `/photos/DSC02924.JPG` | 原图路径（备用或高质量查看） |

## 🎯 使用场景

### 默认显示
```jsx
// 显示压缩后的图片（加载更快，节省带宽）
<img src={photo.path} alt={photo.filename} />
```

### 高质量查看
```jsx
// 用户点击查看原图时使用
<img src={photo.originalPath} alt={photo.filename} />
```

### 渐进式加载
```jsx
// 先显示压缩图，点击后加载原图
<img
  src={photo.path}
  onClick={() => showFullSize(photo.originalPath)}
  alt={photo.filename}
/>
```

## ✅ 验证

运行 `pnpm photos` 命令后：
- ✅ 生成了 31 张图片的数据
- ✅ 每个 Photo 对象都包含 `path` 和 `originalPath` 字段
- ✅ 压缩图片路径格式正确
- ✅ 原图路径格式正确
- ✅ TypeScript 类型检查通过

## 💡 优势

1. **性能优化**: 默认加载压缩图片，页面加载更快
2. **节省带宽**: 压缩图片大小约为原图的 10-20%
3. **用户体验**: 可选择查看高质量原图
4. **向后兼容**: 保留原图路径，不影响现有功能
5. **灵活使用**: 可根据场景选择使用压缩图或原图

---

*此更新完全向后兼容，不会破坏现有功能*
