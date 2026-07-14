using UnityEngine;

public class OutdoorPlayerGroundFix : MonoBehaviour
{
    public Vector3 outdoorStartPosition = new Vector3(-23.38f, 0.8f, -8f);
    public Vector3 outdoorStartRotation = new Vector3(0f, 0f, 0f);

    private void Start()
    {
        CharacterController cc = GetComponent<CharacterController>();

        if (cc != null)
            cc.enabled = false;

        transform.position = outdoorStartPosition;
        transform.rotation = Quaternion.Euler(outdoorStartRotation);

        Camera cam = GetComponentInChildren<Camera>();

        if (cam != null)
        {
            cam.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            cam.transform.localRotation = Quaternion.identity;
        }

        if (cc != null)
            cc.enabled = true;
    }
}