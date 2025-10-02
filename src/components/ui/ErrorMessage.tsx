interface Props {
  message: string | null | undefined;
  className?: string;
}

function getBackgroundColor(message: string | null) {
  if (message === null || message === "") {
    return "bg-clear";
  } else {
    return "bg-red-100";
  }
}

const ErrorMessage = ({ message, className }: Props) => {
  return (
    <div
      className={`inline-block w-full ${getBackgroundColor(
        message ?? null,
      )} rounded px-3 py-2 text-red-500 ${className}`}
    >
      {(message !== null || message !== "") && <p className="text-sm text-red-500">{message}</p>}
    </div>
  );
};

export default ErrorMessage;
