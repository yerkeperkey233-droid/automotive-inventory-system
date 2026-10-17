import { AxiosError } from 'axios';
import type { ApiError } from '../types/api.types';

const translateError = (message: string): string => {
  if (/[\u4e00-\u9fff]/.test(message)) return message;
  const messages: Record<string, string> = {
    'Network Error': '无法连接服务器，请检查服务是否已启动。',
    'No active account found with the given credentials': '用户名或密码错误，或账号已停用。',
    'Authentication credentials were not provided.': '请先登录。',
    'You do not have permission to perform this action.': '你没有执行该操作的权限。',
    'This field is required.': '此字段不能为空。',
    'Enter a valid email address.': '请输入有效的邮箱地址。',
    'A user with that username already exists.': '该用户名已存在。',
  };
  if (messages[message]) return messages[message];
  if (/timeout/i.test(message)) return '请求超时，请稍后重试。';
  if (/status code 401/.test(message)) return '登录已失效，请重新登录。';
  if (/status code 403/.test(message)) return '你没有执行该操作的权限。';
  if (/status code 404/.test(message)) return '请求的记录不存在。';
  return '操作失败，请检查输入或稍后重试。';
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError;

    if (data?.detail) {
      return typeof data.detail === 'string' ? translateError(data.detail) : '发生错误，请稍后重试';
    }

    const firstErrorKey = Object.keys(data || {})[0];
    if (firstErrorKey && data[firstErrorKey]) {
      const errorValue = data[firstErrorKey];
      if (Array.isArray(errorValue)) {
        return translateError(String(errorValue[0]));
      }
      return translateError(String(errorValue));
    }

    return translateError(error.message || '发生错误，请稍后重试');
  }

  if (error instanceof Error) {
    return translateError(error.message);
  }

  return '发生未知错误，请稍后重试';
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown>;
    const errors: Record<string, string> = {};

    Object.entries(data || {}).forEach(([key, value]) => {
      if (key === 'detail') return;
      if (Array.isArray(value)) {
        errors[key] = translateError(String(value[0]));
      } else {
        errors[key] = translateError(String(value));
      }
    });

    return errors;
  }

  return {};
};

export const isAuthError = (error: unknown): boolean => {
  return (
    error instanceof AxiosError &&
    (error.response?.status === 401 || error.response?.status === 403)
  );
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof AxiosError && error.response?.status === 400;
};
