/** 原 S3/R2 桶：管理台「数据下载」页（dashboard/data-download）列表与预签名下载 */
export const R2_OPTSTOR = Symbol('R2_OPTSTOR');

/** 新桶：ZIP 解析等资源上传（R2 Put）及对应对象键前缀，与旧下载桶分离 */
export const R2_STATICSTOR = Symbol('R2_STATICSTOR');
