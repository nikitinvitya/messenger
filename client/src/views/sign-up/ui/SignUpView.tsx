import classNames from 'classnames';
import cls from './SignUpView.module.scss'
import {SignUpForm} from "@/features/sign-up";

interface SignUpViewProps {
  className?: string;
}

export const SignUpView = (props: SignUpViewProps) => {
  return (
    <div className={classNames(cls.signUpView)}>
      <h2>Create account</h2>
      <SignUpForm />
    </div>
  );
};
