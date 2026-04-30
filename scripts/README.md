# 图片压缩脚本使用说明

## 功能简介

`squoosh.ts` 是一个用于压缩 `photos/originals` 目录下原图的脚本，使用 [squoosh-next](https://github.com/google/squoosh) 进行高效的图片压缩。

## 支持的格式

- **输入格式**: JPG, JPEG, PNG, WebP
- **输出格式**:
  - JPG/JPEG → JPG (使用 MozJPEG)
  - PNG → PNG (使用 OxiPNG)
  - WebP → WebP
  - 其他格式 → WebP（默认）

## 使用方法

### 1. 直接运行脚本
```bash
pnpm run prepare:photos
```

### 2. 手动运行脚本
```bash
esno scripts/squoosh.ts
```

## 压缩配置

脚本使用以下默认配置：

- **JPEG 压缩**:
  - 质量：80%
  - 渐进式：启用

- **WebP 压缩**:
  - 质量：80%
  - 方法：6（最高质量）

- **PNG 压缩**:
  - 级别：3（平衡速度和压缩率）
  - 隔行扫描：禁用

## 输出目录

压缩后的主图会保存在 `public/photos/compressed/` 目录下，缩略图会保存在 `public/photos/thumb/` 目录下，文件名保持和原图一致。

## 目录约定

- `photos/originals/`: 原图目录，会被 `.gitignore` 忽略，不会部署到线上
- `public/photos/compressed/`: 前端展示用主图
- `public/photos/thumb/`: 缩略图
- `server/utils/data.ts`: 照片元数据，由 `scripts/photo.ts` 生成

部署环境不会包含 `photos/originals/`，所以新增或修改照片后，请在本地运行 `pnpm run prepare:photos`，然后提交生成的 `server/utils/data.ts`、`public/photos/compressed/` 和 `public/photos/thumb/`。

## 📊 自动生成报告

压缩脚本运行完成后会自动生成对比报告：

- **`compression-report.md`** - 详细的压缩分析报告

报告包含以下内容：
- 📊 总体压缩统计
- 📋 详细的文件对比表
- 🎯 压缩效果分析
- 🏆 最佳压缩效果排名

## 压缩效果

根据测试结果，脚本可以实现：
- **平均压缩率**: 80-95%
- **文件大小**: 从 10-20MB 压缩到 1-4MB
- **保持良好的图片质量**

## 功能特点

1. **并行处理**: 利用多核 CPU 并行压缩多张图片
2. **自动创建目录**: 自动创建输出目录
3. **详细日志**: 显示压缩进度和结果统计
4. **错误处理**: 完善的错误处理机制
5. **压缩统计**: 显示原文件大小、压缩后大小和节省的空间

## 注意事项

- 确保有足够的磁盘空间存储压缩后的图片
- 压缩过程会占用较多 CPU 资源
- 大文件压缩可能需要较长时间
- 原图不应放在 `public/photos` 根目录，否则会被构建进 `dist`
- 压缩后的文件不会覆盖原图

## 自定义配置

如需调整压缩参数，可以修改 `scripts/squoosh.ts` 中的 `compressOptions` 配置对象。
