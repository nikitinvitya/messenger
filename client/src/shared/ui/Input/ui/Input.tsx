'use client';

import React from 'react';
import cls from './Input.module.scss';
import classNames from 'classnames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={classNames(cls.input, className)}
      {...props}
    />
  );
};
