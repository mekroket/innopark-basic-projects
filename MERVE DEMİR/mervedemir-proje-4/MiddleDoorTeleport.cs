using UnityEngine;

public class MiddleDoorTeleport : MonoBehaviour
{
    public Transform targetPoint;

    private void OnTriggerEnter(Collider other)
    {
        if (!other.CompareTag("Player"))
            return;

        CharacterController controller = other.GetComponent<CharacterController>();

        if (controller != null)
            controller.enabled = false;

        other.transform.position = targetPoint.position;
        other.transform.rotation = targetPoint.rotation;

        if (controller != null)
            controller.enabled = true;
    }
}