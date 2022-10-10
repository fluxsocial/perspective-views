import { getImage } from "junto-utils/api/getProfile";
import { useEffect, useState } from "preact/hooks";
import styles from "./index.scss";

type AvatarProps = {
    author: any;
    onProfileClick?: (did: string) => void;
}

export const Avatar = ({ author, onProfileClick }: AvatarProps) => {
    const [img, setImage] = useState(null);

    useEffect(() => {
        if (author.thumbnailPicture) {
            getImage(author.thumbnailPicture)
                .then(data => setImage(data))
                .catch(e => console.error(e))
        }
    }, [author])

    return (
        <j-avatar
            class={styles.messageAvatar}
            src={img}
            hash={author?.did}
            onClick={() => onProfileClick(author?.did)}
        ></j-avatar>
    )
}