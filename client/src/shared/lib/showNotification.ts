export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  onClick?: () => void;
}

const createCircularIcon = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const canvasSize = 192;
      const avatarSize = 160;

      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) return resolve(url);

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      const offset = (canvasSize - avatarSize) / 2;

      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(
        img,
        sx, sy, minDim, minDim,
        offset, offset, avatarSize, avatarSize
      );

      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve(url);
  });
};

export const showBrowserNotification = async ({ title, body, icon, onClick }: NotificationOptions) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  let showedIcon = icon;
  if (icon) {
    showedIcon = await createCircularIcon(icon);
  }

  const notification = new Notification(title, {
    body,
    icon: showedIcon,
  });

  if (onClick) {
    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      onClick();
      notification.close();
    };
  }
};