using UnityEngine;

public class ForcePlayerCamera : MonoBehaviour
{
    public Vector3 startPosition = new Vector3(-23.38f, 0.8f, -8f);
    public Vector3 startRotation = new Vector3(0f, 0f, 0f);

    void Start()
    {
        // Player tag garanti
        gameObject.tag = "Player";

        // Diğer bütün kameraları kapat
        Camera[] allCameras = FindObjectsOfType<Camera>();

        foreach (Camera cam in allCameras)
        {
            if (!cam.transform.IsChildOf(transform))
            {
                cam.gameObject.SetActive(false);
            }
        }

        CharacterController cc = GetComponent<CharacterController>();

        if (cc != null)
            cc.enabled = false;

        transform.position = startPosition;
        transform.rotation = Quaternion.Euler(startRotation);

        Camera playerCamera = GetComponentInChildren<Camera>(true);

        if (playerCamera != null)
        {
            playerCamera.gameObject.SetActive(true);
            playerCamera.tag = "MainCamera";
            playerCamera.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            playerCamera.transform.localRotation = Quaternion.identity;
            playerCamera.fieldOfView = 70f;
        }
        else
        {
            Debug.LogError("Player altında Camera bulunamadı.");
        }

        if (cc != null)
            cc.enabled = true;
    }
}