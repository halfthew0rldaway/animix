type LoadingMascotProps = {
  message?: string;
};

export default function LoadingMascot({
  message = "Loading data...",
}: LoadingMascotProps) {
  return (
    <div className="loading-wrap">
      <div className="loading-mascot">
        <span className="loading-mouth" />
      </div>
      <div className="loading-bar" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
