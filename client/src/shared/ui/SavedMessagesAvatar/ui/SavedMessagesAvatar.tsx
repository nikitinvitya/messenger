'use client';

import classNames from 'classnames';
import Image from 'next/image';
import SavedMessagesIcon from '@/shared/assets/SavedMessagesIcon.svg';
import cls from './SavedMessagesAvatar.module.scss';

interface SavedMessagesAvatarProps {
  size?: number;
  className?: string;
}

export const SavedMessagesAvatar = ({ size = 50, className }: SavedMessagesAvatarProps) => {
  const iconSize = Math.round(size * 0.52);

  return (
    <span
      className={classNames(cls.root, className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={SavedMessagesIcon.src}
        alt=""
        width={iconSize}
        height={iconSize}
        className={cls.icon}
      />
    </span>
  );
};
