export const Button = ({ className = "", ...rest }) => {
  return (
    <button
      className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-primary text-white bg-primary transition hover:bg-primary-dark hover:shadow-primary-sm focus:outline-none focus:ring-2  focus:ring-primary-dark disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-primary ${className}`}
      {...rest}
    />
  );
};
