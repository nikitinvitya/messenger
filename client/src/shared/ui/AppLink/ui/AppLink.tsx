'use client';

import classNames from "classnames";
import { memo, type ReactNode } from 'react';
import cls from './AppLink.module.scss';
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";


interface AppLinkProps extends LinkProps {
  className?: string;
  children?: ReactNode;
  activeClassName?: string;
}

export const AppLink = memo((props: AppLinkProps) => {
  const {
    href,
    className,
    children,
    activeClassName = '',
    ...otherProps
  } = props;

  const pathname = usePathname();
  const isActive = pathname.startsWith(href.toString());

  const mods = {
    [activeClassName]: isActive,
  };

  const additional = [
    className,
  ];

  return (
    <Link
      href={href}
      className={classNames(cls.AppLink, mods, additional)}
      {...otherProps}
    >
      {children}
    </Link>
  );
});
