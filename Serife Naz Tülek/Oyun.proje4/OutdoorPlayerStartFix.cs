using UnityEngine;

public class OutdoorPlayerStartFix : MonoBehaviour
{
    public Vector3 startPosition = new Vector3(-23.38f, 1.2f, -8f);
    public Vector3 startRotation = new Vector3(0f, 0f, 0f);

    void Start()
    {
        CharacterController cc = GetComponent<CharacterController>();

        if (cc != null)
            cc.enabled = false;

        transform.position = startPosition;
        transform.rotation = Quaternion.Euler(startRotation);

        Camera cam = GetComponentInChildren<Camera>();

        if (cam != null)
        {
            cam.transform.localPosition = new Vector3(0f, 0.7f, 0f);
            cam.transform.localRotation = Quaternion.identity;
            cam.fieldOfView = 70f;
        }

        if (cc != null)
            cc.enabled = true;
    }
}