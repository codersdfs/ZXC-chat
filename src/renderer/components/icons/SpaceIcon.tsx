import FileIcon from "./FileIcon";

interface SpaceIconProps {
  icon?: string;
  className?: string;
  size?: number;
}

const SpaceIcon = ({ icon, className = "", size }: SpaceIconProps) => {
  if (icon) {
    return <span className={className}>{icon}</span>;
  }
  return <FileIcon className={className} size={size} />;
};

export default SpaceIcon;