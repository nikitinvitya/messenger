import classNames from 'classnames';
import cls from './SignInView.module.scss'
import {SignInForm} from "@/features/sign-in";

interface SignInViewProps {
  className?: string;
}

export const SignInView = (props: SignInViewProps) => {
  return (
    <div className={classNames(cls.signInView)}>
      <h2>Login</h2>
      <div className={cls.formShell}>
        <SignInForm />
      </div>
    </div>
  );
};
